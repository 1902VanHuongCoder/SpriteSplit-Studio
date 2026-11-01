import os
import sys
import io
import time
import subprocess
import asyncio
import base64
import zipfile
import uvicorn
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from PIL import Image

import pytoshop
import psd_tools
from core.segmenter import process_character_image, extract_manual_part, defringe_rgba
from core.psd_exporter import export_character_assets, sanitize_filename
from core.animator import enrich_layers_with_rig_defaults, compute_spacious_stage_for_layers, export_character_animation

app = FastAPI(title="SpriteSplit Studio API")

# Xử lý đường dẫn khi chạy từ mã nguồn hoặc đóng gói thành file .exe
if getattr(sys, "frozen", False):
    EXE_DIR = os.path.dirname(sys.executable)
    RESOURCE_DIR = getattr(sys, "_MEIPASS", os.path.join(EXE_DIR, "_internal"))
    BASE_DIR = EXE_DIR
    STATIC_DIR = os.path.join(RESOURCE_DIR, "static")
    if not os.path.exists(STATIC_DIR):
        STATIC_DIR = os.path.join(EXE_DIR, "_internal", "static")
    SAMPLE_PATH = os.path.join(RESOURCE_DIR, "sample.png")
    if not os.path.exists(SAMPLE_PATH):
        SAMPLE_PATH = os.path.join(EXE_DIR, "sample.png")
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    STATIC_DIR = os.path.join(BASE_DIR, "static")
    SAMPLE_PATH = os.path.join(BASE_DIR, "sample.png")

OUTPUT_DIR = os.path.join(BASE_DIR, "output")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Lưu trạng thái ảnh hiện tại trong session bộ nhớ
CURRENT_STATE = {
    "image_bytes": None,
    "filename": "",
    "width": 0,
    "height": 0,
    "parts": [],
    "last_result": None
}

# Lưu vết các lần xuất file (export_id -> thư mục xuất)
LAST_EXPORTS = {}

def _show_folder_dialog(current_path="", title="Chọn thư mục lưu kết quả xuất file"):
    """Mở hộp thoại chọn thư mục chuẩn của Windows (ẩn cửa sổ Tk phụ)."""
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        initial = current_path if current_path and os.path.exists(current_path) else (OUTPUT_DIR if os.path.exists(OUTPUT_DIR) else None)
        selected = filedialog.askdirectory(initialdir=initial, title=title)
        root.destroy()
        return selected or ""
    except Exception as e:
        print("Folder picker exception:", e)
        return ""

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>SpriteSplit Studio is running. Static files missing.</h1>"

@app.get("/api/default-output-dir")
async def get_default_output_dir():
    """Lấy đường dẫn thư mục lưu mặc định."""
    return {
        "default_dir": os.path.abspath(OUTPUT_DIR)
    }

@app.post("/api/select-folder")
async def select_folder(req: Request):
    """Mở hộp thoại chọn thư mục Windows để người dùng chọn nơi lưu file kết quả."""
    try:
        body = await req.json()
    except Exception:
        body = {}
    current = body.get("current_path", "")
    title = body.get("title", "Chọn thư mục lưu kết quả xuất file")
    selected_path = await asyncio.to_thread(_show_folder_dialog, current, title)
    return {
        "status": "success",
        "folder": os.path.abspath(selected_path) if selected_path else ""
    }

@app.get("/api/load-sample")
async def load_sample():
    """Tải ảnh mẫu có sẵn."""
    if not os.path.exists(SAMPLE_PATH):
        raise HTTPException(status_code=404, detail="Sample image not found")
    
    with open(SAMPLE_PATH, "rb") as f:
        CURRENT_STATE["image_bytes"] = f.read()
    CURRENT_STATE["filename"] = "sample.png"
    
    start_t = time.time()
    result = process_character_image(CURRENT_STATE["image_bytes"], bg_threshold=240, min_area=80, merge_distance=0, feather_edges=True)
    elapsed = round(time.time() - start_t, 3)

    CURRENT_STATE["width"] = result["width"]
    CURRENT_STATE["height"] = result["height"]
    CURRENT_STATE["parts"] = result["parts"]
    CURRENT_STATE["last_result"] = result

    return {
        "status": "success",
        "filename": "sample.png",
        "width": result["width"],
        "height": result["height"],
        "parts": result["parts"],
        "preview_transparent": result["preview_transparent"],
        "process_time": elapsed
    }

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Tải lên ảnh mới từ máy tính."""
    contents = await file.read()
    CURRENT_STATE["image_bytes"] = contents
    CURRENT_STATE["filename"] = file.filename

    start_t = time.time()
    result = process_character_image(contents, bg_threshold=240, min_area=80, merge_distance=0, feather_edges=True)
    elapsed = round(time.time() - start_t, 3)

    CURRENT_STATE["width"] = result["width"]
    CURRENT_STATE["height"] = result["height"]
    CURRENT_STATE["parts"] = result["parts"]
    CURRENT_STATE["last_result"] = result

    return {
        "status": "success",
        "filename": file.filename,
        "width": result["width"],
        "height": result["height"],
        "parts": result["parts"],
        "preview_transparent": result["preview_transparent"],
        "process_time": elapsed
    }

class ReprocessRequest(BaseModel):
    bg_threshold: int = 240
    min_area: int = 80
    merge_distance: int = 0
    feather_edges: bool = True

@app.post("/api/reprocess")
async def reprocess_image(req: ReprocessRequest):
    """Tính toán lại danh sách bộ phận với các thông số tinh chỉnh mới."""
    if not CURRENT_STATE["image_bytes"]:
        raise HTTPException(status_code=400, detail="Chưa có ảnh nào được tải lên.")

    start_t = time.time()
    result = process_character_image(
        CURRENT_STATE["image_bytes"],
        bg_threshold=req.bg_threshold,
        min_area=req.min_area,
        merge_distance=req.merge_distance,
        feather_edges=req.feather_edges
    )
    elapsed = round(time.time() - start_t, 3)

    CURRENT_STATE["parts"] = result["parts"]
    CURRENT_STATE["last_result"] = result

    return {
        "status": "success",
        "width": result["width"],
        "height": result["height"],
        "parts": result["parts"],
        "preview_transparent": result["preview_transparent"],
        "process_time": elapsed
    }

class ExportRequest(BaseModel):
    parts: List[dict]
    base_name: Optional[str] = "character"
    bg_threshold: int = 240
    feather_edges: bool = True
    output_dir: Optional[str] = None

@app.post("/api/export")
async def export_assets(req: ExportRequest):
    """Xuất các bộ phận ra file PNG và file PSD."""
    if not CURRENT_STATE["image_bytes"]:
        raise HTTPException(status_code=400, detail="Chưa có ảnh nào để xuất.")

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    safe_base = req.base_name or "character"

    # Cho phép người dùng tùy chọn thư mục lưu file
    if req.output_dir and req.output_dir.strip():
        chosen_dir = req.output_dir.strip()
        os.makedirs(chosen_dir, exist_ok=True)
        sub_dir = chosen_dir  # Lưu trực tiếp vào thư mục người dùng đã chọn trong máy
    else:
        sub_dir = os.path.join(OUTPUT_DIR, f"export_{timestamp}")

    start_t = time.time()
    export_res = export_character_assets(
        CURRENT_STATE["image_bytes"],
        req.parts,
        sub_dir,
        base_name=safe_base,
        bg_threshold=req.bg_threshold,
        feather_edges=req.feather_edges
    )
    elapsed = round(time.time() - start_t, 3)
    export_id = f"export_{timestamp}"
    export_res["export_time"] = elapsed
    export_res["export_id"] = export_id
    
    LAST_EXPORTS[export_id] = sub_dir
    return export_res

@app.get("/api/download-zip/{export_id}")
async def download_zip(export_id: str):
    """Tải file zip chứa toàn bộ kết quả."""
    folder = LAST_EXPORTS.get(export_id, os.path.join(OUTPUT_DIR, export_id))
    if not os.path.exists(folder):
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Tìm file zip trong folder
    for fname in os.listdir(folder):
        if fname.endswith(".zip"):
            return FileResponse(os.path.join(folder, fname), media_type="application/zip", filename=fname)
    raise HTTPException(status_code=404, detail="Zip file not found")

@app.get("/api/download-psd/{export_id}")
async def download_psd(export_id: str):
    """Tải file PSD."""
    folder = LAST_EXPORTS.get(export_id, os.path.join(OUTPUT_DIR, export_id))
    if not os.path.exists(folder):
        raise HTTPException(status_code=404, detail="Export not found")
    
    for fname in os.listdir(folder):
        if fname.endswith(".psd"):
            return FileResponse(os.path.join(folder, fname), media_type="image/vnd.adobe.photoshop", filename=fname)
    raise HTTPException(status_code=404, detail="PSD file not found")

@app.post("/api/open-folder")
async def open_folder(req: dict):
    """Mở thư mục kết quả trực tiếp trong Windows Explorer."""
    path = req.get("path")
    if not path or not os.path.exists(path):
        path = OUTPUT_DIR
    try:
        os.startfile(os.path.abspath(path))
        return {"status": "success", "opened": os.path.abspath(path)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class ManualExtractRequest(BaseModel):
    x: int
    y: int
    w: int
    h: int
    name: Optional[str] = "Bộ phận"
    bg_threshold: int = 240
    feather_edges: bool = True

@app.post("/api/extract-crop")
async def extract_crop(req: ManualExtractRequest):
    """Bóc tách nền của một vùng khoanh tay thủ công."""
    if not CURRENT_STATE["image_bytes"]:
        raise HTTPException(status_code=400, detail="Chưa có ảnh nào được tải lên.")

    start_t = time.time()
    res = extract_manual_part(
        CURRENT_STATE["image_bytes"],
        x=req.x,
        y=req.y,
        w=req.w,
        h=req.h,
        bg_threshold=req.bg_threshold,
        feather_edges=req.feather_edges
    )
    elapsed = round(time.time() - start_t, 3)
    res["name"] = req.name or "Bộ phận"
    res["process_time"] = elapsed
    return res

# ==============================================================================
# TAB 3: KIỂM TRA FILE PSD TỪ PHOTOPEA (TRÊN NỀN TỐI / ĐEN)
# ==============================================================================
CURRENT_INSPECT_PSD = {
    "filename": "",
    "width": 0,
    "height": 0,
    "layers": []
}

def _is_flat_solid_bg_layer(name: str, pil_img: Image.Image, psd_w: int, psd_h: int) -> bool:
    """Phát hiện layer Background trắng đặc mặc định của Photopea/Photoshop để tự động ẩn khi tách/diễn hoạt."""
    low = (name or "").strip().lower()
    if low not in ("background", "nen", "nền", "bg", "layer 0", "layer_0"):
        return False
    if pil_img.width < psd_w * 0.9 or pil_img.height < psd_h * 0.9:
        return False
    arr = np.array(pil_img.convert("RGBA"))
    if np.mean(arr[:, :, 3] > 250) < 0.98:
        return False
    if float(np.std(arr[:, :, :3])) > 2.5:
        return False
    return True


@app.post("/api/upload-psd")
async def upload_psd(file: UploadFile = File(...)):
    """Tải lên file PSD từ Photopea hoặc máy tính để kiểm tra viền trên nền tối."""
    contents = await file.read()
    try:
        psd = psd_tools.PSDImage.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc file PSD: {str(e)}")

    width, height = psd.width, psd.height
    layers = []
    leaf_idx = 0

    for lyr in psd.descendants():
        if lyr.is_group():
            continue
        try:
            pil = lyr.topil()
            if pil is None or pil.width == 0 or pil.height == 0:
                continue

            leaf_idx += 1
            buf = io.BytesIO()
            pil.save(buf, format="PNG")
            b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
            bbox = lyr.bbox
            lyr_name = lyr.name or f"Layer_{leaf_idx}"
            is_visible = bool(lyr.visible)
            if _is_flat_solid_bg_layer(lyr_name, pil, width, height):
                is_visible = False

            layers.append({
                "id": leaf_idx,
                "name": lyr_name,
                "x": int(bbox[0]),
                "y": int(bbox[1]),
                "w": int(bbox[2] - bbox[0]),
                "h": int(bbox[3] - bbox[1]),
                "visible": is_visible,
                "opacity": int(lyr.opacity),
                "image": b64
            })
        except Exception as err:
            print(f"Error extracting layer {leaf_idx}:", err)

    # Nếu có bất kỳ layer nào tràn ra ngoài khung PSD gốc (x < 0, y < 0, x+w > width, y+h > height),
    # tự động mở rộng khung chứa để không bao giờ bị mất hình bộ phận
    if layers:
        min_lx = min(0, min(l["x"] for l in layers))
        min_ly = min(0, min(l["y"] for l in layers))
        if min_lx < 0 or min_ly < 0:
            shift_x = -min_lx
            shift_y = -min_ly
            for l in layers:
                l["x"] += shift_x
                l["y"] += shift_y
            width += shift_x
            height += shift_y
        max_rx = max(l["x"] + l["w"] for l in layers)
        max_ry = max(l["y"] + l["h"] for l in layers)
        width = max(width, max_rx)
        height = max(height, max_ry)

    CURRENT_INSPECT_PSD["filename"] = file.filename
    CURRENT_INSPECT_PSD["width"] = width
    CURRENT_INSPECT_PSD["height"] = height
    CURRENT_INSPECT_PSD["layers"] = layers

    return {
        "status": "success",
        "filename": file.filename,
        "width": width,
        "height": height,
        "layers": layers
    }

class DefringePsdRequest(BaseModel):
    inset_px: int = 1
    layer_id: Optional[int] = None

@app.post("/api/defringe-psd-layers")
async def defringe_psd_layers(req: DefringePsdRequest):
    """Khử sạch viền trắng cho layer được chọn (hoặc tất cả layer nếu không chọn riêng)."""
    if not CURRENT_INSPECT_PSD["layers"]:
        raise HTTPException(status_code=400, detail="Chưa có file PSD nào được tải lên để khử viền.")

    target_layers = [
        lyr for lyr in CURRENT_INSPECT_PSD["layers"]
        if req.layer_id is None or lyr["id"] == req.layer_id
    ]

    if not target_layers:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy layer id={req.layer_id} để khử viền.")

    for lyr in target_layers:
        try:
            header, encoded = lyr["image"].split(",", 1)
            img_data = base64.b64decode(encoded)
            pil = Image.open(io.BytesIO(img_data)).convert("RGBA")
            arr = np.array(pil)
            cleaned = defringe_rgba(arr, inset_px=req.inset_px)
            
            clean_pil = Image.fromarray(cleaned)
            buf = io.BytesIO()
            clean_pil.save(buf, format="PNG")
            lyr["image"] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception as err:
            print("Defringe layer error:", err)

    return {
        "status": "success",
        "affected_layer_id": req.layer_id,
        "layers": CURRENT_INSPECT_PSD["layers"]
    }

class SyncLayersRequest(BaseModel):
    layers: List[dict]

@app.post("/api/sync-psd-layers")
async def sync_psd_layers(req: SyncLayersRequest):
    """Đồng bộ danh sách layer (cho Undo/Redo) để xuất file luôn chuẩn."""
    CURRENT_INSPECT_PSD["layers"] = req.layers
    return {"status": "success"}

class ExportInspectedRequest(BaseModel):
    output_dir: Optional[str] = None
    base_name: Optional[str] = "inspected_character"

@app.post("/api/export-inspected-psd")
async def export_inspected_psd(req: ExportInspectedRequest):
    """Xuất lại toàn bộ các layer đã kiểm tra / khử sạch viền sang file PSD và PNG."""
    if not CURRENT_INSPECT_PSD["layers"]:
        raise HTTPException(status_code=400, detail="Chưa có layer nào để xuất.")

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    safe_base = req.base_name or "cleaned_character"
    
    if req.output_dir and req.output_dir.strip():
        chosen_dir = req.output_dir.strip()
        os.makedirs(chosen_dir, exist_ok=True)
        sub_dir = chosen_dir
    else:
        sub_dir = os.path.join(OUTPUT_DIR, f"inspect_{timestamp}")
        os.makedirs(sub_dir, exist_ok=True)

    png_dir = os.path.join(sub_dir, "png_parts")
    os.makedirs(png_dir, exist_ok=True)

    width = CURRENT_INSPECT_PSD["width"] or 1024
    height = CURRENT_INSPECT_PSD["height"] or 765
    
    psd = pytoshop.core.PsdFile(num_channels=3, height=height, width=width)
    exported_pngs = []

    for lyr in CURRENT_INSPECT_PSD["layers"]:
        if not lyr.get("visible", True):
            continue
        safe_name = sanitize_filename(lyr["name"])
        header, encoded = lyr["image"].split(",", 1)
        img_bytes = base64.b64decode(encoded)
        pil = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        
        # Lưu PNG
        png_filename = f"{lyr['id']:02d}_{safe_name}.png"
        png_path = os.path.join(png_dir, png_filename)
        pil.save(png_path, format="PNG")
        exported_pngs.append(png_path)

        # Lưu PSD layer
        arr = np.array(pil)
        layer_rec = pytoshop.layers.LayerRecord(
            name=safe_name,
            top=lyr["y"],
            left=lyr["x"],
            bottom=lyr["y"] + lyr["h"],
            right=lyr["x"] + lyr["w"],
            opacity=255,
            visible=True
        )
        layer_rec.channels = {
            0: pytoshop.layers.ChannelImageData(image=arr[:, :, 0]),
            1: pytoshop.layers.ChannelImageData(image=arr[:, :, 1]),
            2: pytoshop.layers.ChannelImageData(image=arr[:, :, 2]),
            -1: pytoshop.layers.ChannelImageData(image=arr[:, :, 3])
        }
        layer_rec.mask._has_real_mask = False
        psd.layer_and_mask_info.layer_info.layer_records.append(layer_rec)

    # Lưu PSD
    psd_filename = f"{sanitize_filename(safe_base)}_cleaned.psd"
    psd_path = os.path.join(sub_dir, psd_filename)
    with open(psd_path, "wb") as f:
        psd.write(f)

    # Tạo zip
    zip_path = os.path.join(sub_dir, f"{sanitize_filename(safe_base)}_cleaned.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(psd_path, arcname=psd_filename)
        for p in exported_pngs:
            z.write(p, arcname=f"png_parts/{os.path.basename(p)}")

    export_id = f"inspect_{timestamp}"
    LAST_EXPORTS[export_id] = sub_dir
    return {
        "status": "success",
        "export_id": export_id,
        "output_dir": sub_dir,
        "psd_file": psd_path,
        "zip_file": zip_path,
        "total_parts": len(exported_pngs)
    }


# =========================================================
# TAB 4: 2D CHARACTER ANIMATION & PIVOT RIGGING ENDPOINTS
# =========================================================
@app.post("/api/upload-anim-psd")
async def upload_anim_psd(file: UploadFile = File(...)):
    """Tải lên file PSD cho Tab 4 (Tạo Animation), tự động bóc tách layer và gán điểm neo Pivot mặc định."""
    contents = await file.read()
    try:
        psd = psd_tools.PSDImage.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc file PSD: {str(e)}")

    width, height = psd.width, psd.height
    raw_layers = []
    leaf_idx = 0

    for lyr in psd.descendants():
        if lyr.is_group():
            continue
        try:
            pil = lyr.topil()
            if pil is None or pil.width == 0 or pil.height == 0:
                continue

            leaf_idx += 1
            buf = io.BytesIO()
            pil.save(buf, format="PNG")
            b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
            bbox = lyr.bbox
            lyr_name = lyr.name or f"Layer_{leaf_idx}"
            is_visible = bool(lyr.visible)
            if _is_flat_solid_bg_layer(lyr_name, pil, width, height):
                is_visible = False

            raw_layers.append({
                "id": leaf_idx,
                "name": lyr_name,
                "x": int(bbox[0]),
                "y": int(bbox[1]),
                "w": int(bbox[2] - bbox[0]),
                "h": int(bbox[3] - bbox[1]),
                "visible": is_visible,
                "opacity": int(lyr.opacity),
                "z_index": leaf_idx - 1,
                "image": b64
            })
        except Exception as err:
            print(f"Error extracting anim layer {leaf_idx}:", err)

    rig_layers, stage_w, stage_h = compute_spacious_stage_for_layers(raw_layers, width, height)
    return {
        "status": "success",
        "filename": file.filename,
        "width": stage_w,
        "height": stage_h,
        "orig_psd_width": width,
        "orig_psd_height": height,
        "layers": rig_layers
    }


@app.get("/api/import-from-inspect")
async def import_from_inspect():
    """Chuyển nhanh toàn bộ các layer PSD đang kiểm tra / đã khử viền ở Tab 3 sang Tab 4."""
    if not CURRENT_INSPECT_PSD["layers"]:
        raise HTTPException(status_code=400, detail="Chưa có file PSD nào ở Tab 3. Hãy tải file PSD lên!")

    width = CURRENT_INSPECT_PSD["width"] or 1024
    height = CURRENT_INSPECT_PSD["height"] or 765
    rig_layers, stage_w, stage_h = compute_spacious_stage_for_layers(CURRENT_INSPECT_PSD["layers"], width, height)
    return {
        "status": "success",
        "filename": CURRENT_INSPECT_PSD["filename"] or "character.psd",
        "width": stage_w,
        "height": stage_h,
        "orig_psd_width": width,
        "orig_psd_height": height,
        "layers": rig_layers
    }


class ExportAnimationRequest(BaseModel):
    layers: List[dict]
    width: int = 1024
    height: int = 765
    anim_config: dict = {}
    output_dir: Optional[str] = None
    base_name: Optional[str] = "character_anim"


@app.post("/api/export-animation")
async def api_export_animation(req: ExportAnimationRequest):
    """Xuất Animation nhân vật ra PNG Sequence, Sprite Sheet, GIF, MP4, Rig JSON và gói ZIP."""
    if not req.layers:
        raise HTTPException(status_code=400, detail="Chưa có layer bộ phận nào để xuất animation.")

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    if req.output_dir and req.output_dir.strip():
        chosen_dir = req.output_dir.strip()
        os.makedirs(chosen_dir, exist_ok=True)
        sub_dir = chosen_dir
    else:
        sub_dir = os.path.join(OUTPUT_DIR, f"anim_{timestamp}")
        os.makedirs(sub_dir, exist_ok=True)

    result = export_character_animation(
        layers=req.layers,
        canvas_w=req.width,
        canvas_h=req.height,
        anim_cfg=req.anim_config,
        output_dir=sub_dir,
        base_name=req.base_name or "character_anim"
    )

    export_id = f"anim_{timestamp}"
    LAST_EXPORTS[export_id] = sub_dir
    result["export_id"] = export_id
    return result


@app.get("/api/download-anim-gif/{export_id}")
async def download_anim_gif(export_id: str):
    folder = LAST_EXPORTS.get(export_id, os.path.join(OUTPUT_DIR, export_id))
    if not os.path.exists(folder):
        raise HTTPException(status_code=404, detail="Export not found")
    for fname in os.listdir(folder):
        if fname.endswith(".gif"):
            return FileResponse(os.path.join(folder, fname), media_type="image/gif", filename=fname)
    raise HTTPException(status_code=404, detail="GIF file not found")


@app.get("/api/download-anim-mp4/{export_id}")
async def download_anim_mp4(export_id: str):
    folder = LAST_EXPORTS.get(export_id, os.path.join(OUTPUT_DIR, export_id))
    if not os.path.exists(folder):
        raise HTTPException(status_code=404, detail="Export not found")
    for fname in os.listdir(folder):
        if fname.endswith(".mp4"):
            return FileResponse(os.path.join(folder, fname), media_type="video/mp4", filename=fname)
    raise HTTPException(status_code=404, detail="MP4 file not found")




# ==========================================
# SVG Vector Rig & Animation Endpoints
# ==========================================
EXAMPLE_DIR = os.path.join(BASE_DIR, "example")
if not os.path.exists(EXAMPLE_DIR):
    res_ex = os.path.join(RESOURCE_DIR, "example")
    if os.path.exists(res_ex):
        EXAMPLE_DIR = res_ex


@app.get("/api/svg-examples")
async def api_get_svg_examples():
    """Lấy danh sách các nhân vật mẫu SVG từ thư mục example"""
    return [
        {
            "id": "nhan_vat",
            "title": "Nhân vật Học sinh (Nam)",
            "subtitle": "Đầy đủ 12 khớp xương, mắt nhắm/mở/trợn, miệng nói/sợ/ngất",
            "rig_file": "nhan_vat_rig.svg",
            "rel_path": "nhan_vat_animation/nhan_vat_animation"
        },
        {
            "id": "ma_nu",
            "title": "Nhân vật Ma Nữ (Nữ)",
            "subtitle": "Váy dài, tóc xõa 2 bên, mắt rỗng, miệng phẳng, khớp tay chân",
            "rig_file": "ma_nu_rig.svg",
            "rel_path": "files/ma_nu_animation/ma_nu_animation"
        }
    ]


@app.get("/api/load-svg-example/{example_id}")
async def api_load_svg_example(example_id: str):
    """Nạp file SVG Rig, pivots.json và danh sách parts từ thư mục example"""
    examples = {
        "nhan_vat": {
            "title": "Nhân vật Học sinh (Nam)",
            "subtitle": "Đầy đủ 12 khớp xương, mắt nhắm/mở/trợn, miệng nói/sợ/ngất",
            "rig_file": "nhan_vat_rig.svg",
            "rel_path": "nhan_vat_animation/nhan_vat_animation"
        },
        "ma_nu": {
            "title": "Nhân vật Ma Nữ (Nữ)",
            "subtitle": "Váy dài, tóc xõa 2 bên, mắt rỗng, miệng phẳng, khớp tay chân",
            "rig_file": "ma_nu_rig.svg",
            "rel_path": "files/ma_nu_animation/ma_nu_animation"
        }
    }
    if example_id not in examples:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhân vật mẫu")

    ex = examples[example_id]
    target_dir = os.path.join(EXAMPLE_DIR, ex["rel_path"].replace("/", os.sep))
    rig_path = os.path.join(target_dir, ex["rig_file"])
    pivots_path = os.path.join(target_dir, "pivots.json")

    if not os.path.exists(rig_path):
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file {ex['rig_file']}")

    with open(rig_path, "r", encoding="utf-8") as f:
        svg_content = f.read()

    pivots_data = {}
    if os.path.exists(pivots_path):
        with open(pivots_path, "r", encoding="utf-8") as f:
            try:
                pivots_data = json.load(f)
            except Exception:
                pivots_data = {}

    parts = []
    parts_dir = os.path.join(target_dir, "parts")
    if os.path.exists(parts_dir):
        for f in os.listdir(parts_dir):
            if f.endswith(".svg"):
                parts.append(f)

    return {
        "status": "success",
        "id": example_id,
        "title": ex["title"],
        "subtitle": ex["subtitle"],
        "filename": ex["rig_file"],
        "svg_content": svg_content,
        "pivots": pivots_data,
        "parts": sorted(parts)
    }


@app.post("/api/upload-svg-rig")
async def api_upload_svg_rig(file: UploadFile = File(...)):
    """Nạp file SVG tùy ý từ máy tính của người dùng"""
    contents = await file.read()
    try:
        svg_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        svg_text = contents.decode("latin-1", errors="ignore")

    return {
        "status": "success",
        "filename": file.filename,
        "svg_content": svg_text
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8765)

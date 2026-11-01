import os
import re
import cv2
import numpy as np
from PIL import Image
import pytoshop
from pytoshop import util
import zipfile
import io
import unicodedata
from core.segmenter import clean_and_defringe_part

# ==============================================================================
# SỬA LỖI TƯƠNG THÍCH PSD VỚI PHOTOPEA & PHOTOSHOP:
# Mặc định pytoshop luôn ghi 36 bytes dữ liệu rỗng cho LayerMask (với size 0x0 và màu đen),
# khiến các phần mềm như Photopea nhận nhầm rằng layer đang có một "Raster Layer Mask"
# che toàn bộ nội dung layer, làm ẩn mất hình ảnh bộ phận nhân vật.
# Khi layer không có mask người dùng chỉ định, chuẩn định dạng file Photoshop quy định
# độ dài (length) của phần LayerMask data phải là 0 (4 byte giá trị 0).
# ==============================================================================
_orig_mask_length = pytoshop.layers.LayerMask.length
_orig_mask_write = pytoshop.layers.LayerMask.write

def _clean_mask_length(self, header):
    if not getattr(self, '_has_real_mask', False):
        return 0
    return _orig_mask_length(self, header)

def _clean_mask_write(self, fd, header):
    if not getattr(self, '_has_real_mask', False):
        util.write_value(fd, 'I', 0)
        return
    _orig_mask_write(self, fd, header)

pytoshop.layers.LayerMask.length = _clean_mask_length
pytoshop.layers.LayerMask.write = _clean_mask_write


def remove_accents(input_str: str) -> str:
    """Chuyển đổi tiếng Việt có dấu thành không dấu an toàn cho tên file và layer."""
    input_str = input_str.replace("đ", "d").replace("Đ", "D")
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def sanitize_filename(name: str) -> str:
    """Loại bỏ ký tự đặc biệt và dấu tiếng Việt để làm tên file chuẩn an toàn tuyệt đối."""
    name = remove_accents(name)
    name = re.sub(r'[^a-zA-Z0-9_\-\(\) ]', "", name)
    name = name.strip().replace(" ", "_")
    return name if name else "part"

def export_character_assets(
    image_input,
    parts_data: list,
    output_dir: str,
    base_name: str = "character",
    bg_threshold: int = 240,
    feather_edges: bool = True,
    defringe_inset: int = 1
) -> dict:
    """
    Xuất các bộ phận ra từng file PNG trong suốt và 1 file PSD đa layer.
    """
    os.makedirs(output_dir, exist_ok=True)
    png_dir = os.path.join(output_dir, "png_parts")
    os.makedirs(png_dir, exist_ok=True)

    if isinstance(image_input, str):
        pil_img = Image.open(image_input).convert("RGBA")
    elif isinstance(image_input, bytes):
        pil_img = Image.open(io.BytesIO(image_input)).convert("RGBA")
    elif isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGBA")
    else:
        raise ValueError("Unsupported image input type")

    width, height = pil_img.size
    img_np = np.array(pil_img)
    rgb = img_np[:, :, :3]
    alpha = img_np[:, :, 3]

    has_alpha_bg = np.mean(alpha < 250) > 0.05

    if has_alpha_bg:
        fg_mask = (alpha > 15).astype(np.uint8) * 255
    else:
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, bg_threshold, 255, cv2.THRESH_BINARY)
        h_pad, w_pad = height + 2, width + 2
        flood_mask = np.zeros((h_pad, w_pad), np.uint8)
        corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
        for pt in corners:
            cv2.floodFill(
                thresh.copy(),
                flood_mask,
                pt,
                0,
                flags=cv2.FLOODFILL_MASK_ONLY | (255 << 8)
            )
        ext_bg = flood_mask[1:height + 1, 1:width + 1]
        fg_mask = (ext_bg == 0).astype(np.uint8) * 255

    # Khởi tạo đối tượng PSD
    psd = pytoshop.core.PsdFile(num_channels=3, height=height, width=width)
    
    # Tạo composite preview cho file PSD
    comp_channels = rgb.transpose(2, 0, 1) # shape (3, height, width)
    psd.image_data = pytoshop.image_data.ImageData(channels=comp_channels)

    exported_pngs = []
    enabled_parts = [p for p in parts_data if p.get("enabled", True)]

    for idx, p in enumerate(enabled_parts, start=1):
        x, y, w, h = p["x"], p["y"], p["w"], p["h"]
        name = p.get("name", f"Part_{idx}")
        safe_name = sanitize_filename(name)

        # Cắt phần ảnh và mask tương ứng với thuật toán khử sạch viền trắng (Defringe)
        crop_rgb = rgb[y:y+h, x:x+w]
        crop_fg = fg_mask[y:y+h, x:x+w].copy()

        crop_rgba = clean_and_defringe_part(
            crop_rgb,
            crop_fg,
            inset_px=defringe_inset,
            feather=feather_edges
        )
        crop_clean_rgb = crop_rgba[:, :, :3]
        crop_clean_alpha = crop_rgba[:, :, 3]

        crop_pil = Image.fromarray(crop_rgba)

        # 1. Lưu file PNG trong suốt sạch viền
        png_filename = f"{idx:02d}_{safe_name}.png"
        png_path = os.path.join(png_dir, png_filename)
        crop_pil.save(png_path, format="PNG")
        exported_pngs.append(png_path)

        # 2. Thêm layer vào PSD với kênh RGBA sạch viền và giữ nguyên tọa độ canvas
        layer_rec = pytoshop.layers.LayerRecord(
            name=safe_name,
            top=y,
            left=x,
            bottom=y + h,
            right=x + w,
            opacity=255,
            visible=True
        )

        layer_rec.channels = {
            0: pytoshop.layers.ChannelImageData(image=crop_clean_rgb[:, :, 0]),
            1: pytoshop.layers.ChannelImageData(image=crop_clean_rgb[:, :, 1]),
            2: pytoshop.layers.ChannelImageData(image=crop_clean_rgb[:, :, 2]),
            -1: pytoshop.layers.ChannelImageData(image=crop_clean_alpha)
        }
        
        # Đánh dấu không có user raster mask để tránh bị ẩn trên Photopea / Photoshop
        layer_rec.mask._has_real_mask = False

        psd.layer_and_mask_info.layer_info.layer_records.append(layer_rec)

    # Lưu file PSD
    psd_filename = f"{sanitize_filename(base_name)}_layers.psd"
    psd_path = os.path.join(output_dir, psd_filename)
    with open(psd_path, "wb") as f:
        psd.write(f)

    # Tạo file zip đóng gói toàn bộ
    zip_path = os.path.join(output_dir, f"{sanitize_filename(base_name)}_exported.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.write(psd_path, arcname=psd_filename)
        for png_p in exported_pngs:
            zip_file.write(png_p, arcname=f"png_parts/{os.path.basename(png_p)}")

    return {
        "status": "success",
        "output_dir": output_dir,
        "psd_file": psd_path,
        "zip_file": zip_path,
        "png_dir": png_dir,
        "total_parts": len(exported_pngs),
        "exported_pngs": [os.path.basename(p) for p in exported_pngs]
    }

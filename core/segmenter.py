import cv2
import numpy as np
from PIL import Image
import io
import base64

def clean_and_defringe_part(
    crop_rgb: np.ndarray,
    crop_mask: np.ndarray,
    inset_px: int = 1,
    feather: bool = True
) -> np.ndarray:
    """
    Xử lý khử sạch viền trắng (White Fringe / Halo) và chống lem nền:
    1. Erode (thu hẹp) mask một khoảng inset_px (1-2px) để cắt bỏ triệt để lớp pixel bị pha trắng ngoài rìa.
    2. Làm mịn mép nhẹ nhàng (Anti-aliasing) để không bị răng cưa.
    3. Tràn màu (Color Inpainting) từ ruột nét vẽ ra mép ngoài để các pixel bán trong suốt
       mang màu thật của nét vẽ (như màu đen của line art), không mang màu trắng của nền.
    Trả về mảng crop_rgba (h, w, 4).
    """
    h, w = crop_mask.shape
    if h <= 2 or w <= 2 or np.sum(crop_mask > 20) == 0:
        return np.dstack([crop_rgb, crop_mask])

    # 1. Thu hẹp mask để cắt bỏ viền lem trắng ngoài cùng
    if inset_px > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        eroded_mask = cv2.erode(crop_mask, kernel, iterations=inset_px)
        # Nếu vùng quá nhỏ bị biến mất thì giữ lại mask gốc
        if np.sum(eroded_mask > 20) == 0:
            eroded_mask = crop_mask.copy()
    else:
        eroded_mask = crop_mask.copy()

    # 2. Làm mịn mép nhẹ nhàng
    if feather:
        smooth_alpha = cv2.GaussianBlur(eroded_mask, (3, 3), 0.5)
    else:
        smooth_alpha = eroded_mask.copy()

    # 3. Khử ám trắng bằng cách tràn màu từ lõi ra vùng chuyển tiếp
    border_zone = ((smooth_alpha > 0) & (eroded_mask < 255)).astype(np.uint8) * 255
    core_zone = (eroded_mask == 255).astype(np.uint8)

    if np.any(border_zone) and np.any(core_zone):
        clean_rgb = cv2.inpaint(crop_rgb, border_zone, inpaintRadius=2, flags=cv2.INPAINT_TELEA)
    else:
        clean_rgb = crop_rgb.copy()

    return np.dstack([clean_rgb, smooth_alpha])

def defringe_rgba(rgba_img: np.ndarray, inset_px: int = 1) -> np.ndarray:
    """
    Khử viền trắng trên ảnh RGBA bất kỳ (ví dụ layer lấy từ file PSD Photopea):
    Erode nhẹ alpha và inpaint màu biên để loại bỏ viền trắng khi hiển thị trên nền đen/tối.
    """
    if len(rgba_img.shape) != 3 or rgba_img.shape[2] != 4:
        return rgba_img
    
    h, w, _ = rgba_img.shape
    if h <= 2 or w <= 2:
        return rgba_img

    rgb = rgba_img[:, :, :3]
    alpha = rgba_img[:, :, 3]

    return clean_and_defringe_part(rgb, alpha, inset_px=inset_px, feather=True)

def process_character_image(
    image_input,
    bg_threshold: int = 240,
    min_area: int = 80,
    merge_distance: int = 0,
    feather_edges: bool = True,
    defringe_inset: int = 1
):
    """
    Tự động phân tích và bóc tách các bộ phận nhân vật từ ảnh.
    Hỗ trợ cả ảnh nền trắng (RGB/RGBA) và ảnh có sẵn nền trong suốt.
    Tự động khử sạch viền trắng (Defringe) trên nền đen/tối.
    """
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

    # Kiểm tra xem ảnh có kênh alpha trong suốt sẵn không
    has_alpha_bg = np.mean(alpha < 250) > 0.05

    if has_alpha_bg:
        # Dùng alpha sẵn có
        fg_mask = (alpha > 15).astype(np.uint8) * 255
    else:
        # Nền trắng: Sử dụng FloodFill từ 4 góc ngoài biên để tìm nền ngoài (exterior background)
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, bg_threshold, 255, cv2.THRESH_BINARY)
        
        # Mở rộng 2 pixel cho floodFill
        h_pad, w_pad = height + 2, width + 2
        flood_mask = np.zeros((h_pad, w_pad), np.uint8)
        
        # FloodFill từ 4 góc
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
        # Foreground là phần KHÔNG thuộc nền ngoài (giữ nguyên mắt, răng, chi tiết trắng bên trong)
        fg_mask = (ext_bg == 0).astype(np.uint8) * 255

    # Xử lý gom nhóm nếu merge_distance > 0
    work_mask = fg_mask.copy()
    if merge_distance > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (merge_distance * 2 + 1, merge_distance * 2 + 1))
        work_mask = cv2.morphologyEx(work_mask, cv2.MORPH_CLOSE, kernel)

    # Tìm các thành phần liên thông
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(work_mask, connectivity=8)

    raw_parts = []
    for i in range(1, num_labels):
        x, y, bw, bh, area = stats[i]
        if area >= min_area and bw > 3 and bh > 3:
            raw_parts.append({
                "raw_id": i,
                "x": int(x),
                "y": int(y),
                "w": int(bw),
                "h": int(bh),
                "area": int(area),
                "cx": float(centroids[i][0]),
                "cy": float(centroids[i][1])
            })

    # Sắp xếp các part theo vị trí từ trái sang phải, trên xuống dưới
    raw_parts.sort(key=lambda p: (p["x"], p["y"]))

    parts = []
    face_count = 1
    mouth_count = 1
    part_count = 1

    # Phân loại thông minh (Smart Semantic Labeling)
    for idx, p in enumerate(raw_parts, start=1):
        x, y, bw, bh, area = p["x"], p["y"], p["w"], p["h"], p["area"]
        cx, cy = p["cx"], p["cy"]

        label = f"Chi tiết {part_count}"
        role = "detail"

        # 1. Nhân vật mẫu nguyên vẹn bên trái
        if cx < width * 0.32 and bh > height * 0.65:
            label = "Nhân vật mẫu (Full Reference)"
            role = "full"
        # 2. Đầu
        elif cx > width * 0.32 and cx < width * 0.65 and cy < height * 0.35 and bw > 100:
            label = "Đầu (Head)"
            role = "head"
        # 3. Thân áo
        elif cx > width * 0.35 and cx < width * 0.65 and cy >= height * 0.35 and cy < height * 0.65 and bw > 100:
            label = "Thân áo (Torso)"
            role = "torso"
        # 4. Tay trái (bên trái người xem)
        elif cx > width * 0.25 and cx < width * 0.42 and cy >= height * 0.35 and cy < height * 0.75:
            label = "Tay trái (Left Arm)"
            role = "left_arm"
        # 5. Tay phải (bên phải người xem)
        elif cx > width * 0.55 and cx < width * 0.72 and cy >= height * 0.35 and cy < height * 0.75:
            label = "Tay phải (Right Arm)"
            role = "right_arm"
        # 6. Chân trái
        elif cx > width * 0.32 and cx < width * 0.48 and cy >= height * 0.60:
            label = "Chân trái (Left Leg)"
            role = "left_leg"
        # 7. Chân phải
        elif cx >= width * 0.48 and cx < width * 0.65 and cy >= height * 0.60:
            label = "Chân phải (Right Leg)"
            role = "right_leg"
        # 8. Mắt & Miệng bên phải
        elif cx > width * 0.68:
            if cy >= height * 0.50:
                label = f"Miệng biểu cảm {mouth_count} (Mouth)"
                role = "mouth"
                mouth_count += 1
            else:
                label = f"Mắt & Biểu cảm {face_count} (Face/Eye)"
                role = "face"
                face_count += 1
        else:
            label = f"Bộ phận {part_count}"
            part_count += 1

        # Trích xuất ảnh RGBA crop của part với thuật toán khử sạch viền trắng (Defringe)
        crop_rgb = rgb[y:y+bh, x:x+bw]
        part_mask = (labels[y:y+bh, x:x+bw] == p["raw_id"]).astype(np.uint8) * 255
        
        crop_rgba = clean_and_defringe_part(
            crop_rgb,
            part_mask,
            inset_px=defringe_inset,
            feather=feather_edges
        )

        # Thumbnail Base64 cho UI
        crop_pil = Image.fromarray(crop_rgba)
        thumb_buffer = io.BytesIO()
        crop_pil.save(thumb_buffer, format="PNG")
        thumb_base64 = "data:image/png;base64," + base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

        parts.append({
            "id": idx,
            "name": label,
            "role": role,
            "x": x,
            "y": y,
            "w": bw,
            "h": bh,
            "area": area,
            "enabled": True,
            "thumbnail": thumb_base64
        })

    # Tạo ảnh preview trong suốt toàn bộ (đã khử viền lem trắng)
    full_rgba = clean_and_defringe_part(
        rgb,
        fg_mask,
        inset_px=defringe_inset,
        feather=feather_edges
    )
    full_pil = Image.fromarray(full_rgba)
    full_buffer = io.BytesIO()
    full_pil.save(full_buffer, format="PNG")
    full_base64 = "data:image/png;base64," + base64.b64encode(full_buffer.getvalue()).decode("utf-8")

    return {
        "width": width,
        "height": height,
        "parts": parts,
        "preview_transparent": full_base64
    }

def extract_manual_part(
    image_input,
    x: int,
    y: int,
    w: int,
    h: int,
    bg_threshold: int = 240,
    feather_edges: bool = True,
    defringe_inset: int = 1
) -> dict:
    """
    Tách nền một vùng chữ nhật do người dùng khoanh vùng thủ công trên ảnh.
    Khử sạch nền trắng và viền lem (Defringe), không để lại viền trắng khi lên nền tối.
    """
    if isinstance(image_input, str):
        pil_img = Image.open(image_input).convert("RGBA")
    elif isinstance(image_input, bytes):
        pil_img = Image.open(io.BytesIO(image_input)).convert("RGBA")
    elif isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGBA")
    else:
        raise ValueError("Unsupported image input type")

    full_w, full_h = pil_img.size
    
    # Giới hạn toạ độ trong khung ảnh
    x = max(0, min(x, full_w - 1))
    y = max(0, min(y, full_h - 1))
    w = max(4, min(w, full_w - x))
    h = max(4, min(h, full_h - y))

    img_np = np.array(pil_img)
    rgb = img_np[:, :, :3]
    alpha = img_np[:, :, 3]

    crop_rgb = rgb[y:y+h, x:x+w]
    crop_alpha = alpha[y:y+h, x:x+w]

    # Kiểm tra xem ảnh gốc có sẵn alpha trong suốt không
    has_alpha = np.mean(crop_alpha < 250) > 0.05

    if has_alpha:
        fg_mask = (crop_alpha > 15).astype(np.uint8) * 255
    else:
        # Nền trắng: floodFill từ các góc của vùng crop để khử viền ngoài
        gray = cv2.cvtColor(crop_rgb, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, bg_threshold, 255, cv2.THRESH_BINARY)
        
        ch, cw = thresh.shape
        mask = np.zeros((ch + 2, cw + 2), np.uint8)
        corners = [(0, 0), (cw - 1, 0), (0, ch - 1), (cw - 1, ch - 1)]
        for pt in corners:
            cv2.floodFill(thresh.copy(), mask, pt, 0, flags=cv2.FLOODFILL_MASK_ONLY | (255 << 8))

        ext_bg = mask[1:ch+1, 1:cw+1]
        fg_mask = (ext_bg == 0).astype(np.uint8) * 255

    crop_rgba = clean_and_defringe_part(
        crop_rgb,
        fg_mask,
        inset_px=defringe_inset,
        feather=feather_edges
    )
    crop_pil = Image.fromarray(crop_rgba)

    thumb_buffer = io.BytesIO()
    crop_pil.save(thumb_buffer, format="PNG")
    thumb_base64 = "data:image/png;base64," + base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")

    return {
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "area": int(np.sum(crop_rgba[:, :, 3] > 20)),
        "thumbnail": thumb_base64
    }

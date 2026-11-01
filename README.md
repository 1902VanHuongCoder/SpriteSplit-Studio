# 🎨 SpriteSplit Studio - Tách Bộ Phận Nhân Vật 2D & Animation Rigging Suite

**SpriteSplit Studio** là phần mềm máy tính chuyên dụng all-in-one dành cho các nhà làm phim hoạt hình 2D, game developer và họa sĩ đồ họa:
1. **Bóc tách bộ phận nhân vật tự động & thủ công** từ sprite sheet / puppet breakdown thành các file PNG trong suốt và file PSD đa layer.
2. **Khử viền lem trắng (Defringing & Matte removal)** chuyên sâu cho file PSD.
3. **Gắn xương & Điểm neo (Rigging & Pivot Editor)** cho cả ảnh Raster (PSD/PNG) và Vector SVG.
4. **Bộ diễn hoạt 18+ Presets chuyển động chuẩn Forward Kinematics (FK)**: Đi bộ, chạy bộ, vẫy tay, nhảy nhót, chớp mắt tự động, nhép miệng tự nhiên.
5. **Đóng gói trực tiếp sang Paul To Animation (.character.json / .paulto / .anime)** với đầy đủ keyframes và animation tracks.

---

## 🚀 Các Tính Năng Chính

### 1. Tab 1: Bóc Tách Tự Động (Auto Split)
- Quét toàn bộ ảnh bằng thuật toán OpenCV Connected Components & Exterior FloodFill.
- Tự động nhận diện và phân loại: Đầu, Thân, 2 Tay, 2 Chân, Mắt, Miệng, Biểu cảm.
- Khử viền lem thông minh (Alpha matting).
- Tùy chỉnh thanh trượt linh hoạt: Ngưỡng màu nền, Lọc nhiễu tối thiểu, Khoảng cách gom nhóm.
- Nút dọn sạch vùng làm việc (Clear workspace) và xóa bỏ từng bộ phận nhanh chóng.
- Xuất 1-click: Toàn bộ PNG nền trong suốt + 1 file `.PSD` đa layer.

### 2. Tab 2: Khoanh Vùng Thủ Công (Manual Split)
- Vẽ vùng chọn tự do bằng chuột trên ảnh để khoanh vùng bất kỳ chi tiết phức tạp nào.
- Thuật toán bóc tách thông minh loại bỏ nền trắng ngoài viền, giữ trọn vẹn chi tiết bên trong.
- Gợi ý tên nhanh theo chuẩn giải phẫu (Đầu, Thân, Tay T, Tay P, Chân T, Chân P, Mắt, Miệng...).
- Quản lý danh sách layer gọn gàng, xem trước thumbnail, đổi tên, bật/tắt hoặc xóa từng phần.
- Xuất ra file PNG và file PSD giữ nguyên tọa độ gốc.

### 3. Tab 3: Kiểm Tra File PSD (Soi Viền & Khử Sạch Lem)
- Nền tối chuyên dụng giúp phát hiện từng pixel viền trắng/viền lem xung quanh mép ảnh.
- Thuật toán khử viền lem Alpha Erosion & Color Bleed tiên tiến, phục hồi độ trong suốt hoàn hảo.
- Tính năng Hoàn tác (Undo) và Làm lại (Redo) không giới hạn.
- Xuất file PSD và PNG sạch viền 100%.

### 4. Tab 4: Tạo Animation (Rig & Pivot Editor cho Raster/PSD)
- Nhập trực tiếp file PSD bóc tách hoặc bộ phận nhân vật.
- Căn chỉnh điểm neo Pivot trực tiếp trên sân khấu tương tác; xoay góc vĩnh viễn không bị reset.
- Bổ sung nút Lật ngang (Flip H), Lật dọc (Flip V), căn tỉ lệ (Scale).
- Danh sách layer 1 cột trực quan nằm ngay dưới bảng điều khiển khớp xương.
- Thư viện 18 Preset chuyển động sinh động (Đi bộ, chạy bộ, giơ tay, thở nhẹ...).
- Xuất video MP4, ảnh động GIF, chuỗi PNG, và gói dự án Paul To Animation.

### 5. Tab 5: Tạo Animation Vector SVG (Sắc Nét Vô Hạn)
- Hỗ trợ nhập mọi file vector SVG từ Illustrator, Inkscape, Figma hoặc code SVG.
- **Bộ nhận diện đa tầng (Multi-tier Rigging Engine)**:
  - Tự động đọc thuộc tính `data-pivot="x,y"` trực tiếp trên layer.
  - Tự động bóc tách nhóm định nghĩa `<g id="pivots">` / `<g id="joints">` với các điểm marker và thẻ `<title>`.
  - Kế thừa tâm khớp cha thông minh (Bone group & Artworks) chống xoay kép.
  - Dự phòng Bounding Box giải phẫu (Anatomical Fallback) tự động tính toán vị trí cổ, hông, vai, cổ chân.
- Hiển thị sân khấu `overflow: visible` cho phép nhân vật sải tay chân tự do ra ngoài khung hình gốc mà không bị cắt xén.
- Tùy chọn thời lượng xuất hoạt họa (1.5s, 2.0s, 2.4s, 3.0s, 4.0s, 5.0s).

---

## 🛠️ Cài Đặt & Chạy Phần Mềm

### Yêu cầu hệ thống:
- Hệ điều hành: Windows 10 / 11 (64-bit)
- Python 3.10+ (nếu chạy từ mã nguồn)

### Chạy từ mã nguồn:
1. Clone repository:
   ```bash
   git clone https://github.com/1902VanHuongCoder/SpriteSplit-Studio.git
   cd SpriteSplit-Studio
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
3. Khởi chạy ứng dụng:
   ```bash
   python server.py
   ```
   Ứng dụng sẽ tự động mở giao diện web tại `http://127.0.0.1:8000`.

---

## 📦 Bản Đóng Gói Chạy Ngay (Standalone / Portable)

Nếu muốn chia sẻ cho máy tính khác sử dụng mà **không cần cài Python**:
- Chạy file `SpriteSplitStudio.exe` trong thư mục `dist/SpriteSplitStudio/` hoặc giải nén từ file `dist/SpriteSplitStudio_v1.0_Windows.zip`.

---

## 📄 License
Phát triển và phân phối bởi **Văn Hướng Coder**. Giữ toàn quyền sở hữu trí tuệ.

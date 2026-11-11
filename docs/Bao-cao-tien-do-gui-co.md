# BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỀ TÀI

**Tên đề tài:** Nền tảng hỗ trợ logistics đô thị thông minh  
**Mã đề tài:** B2025-GHA-05  
**Phạm vi so sánh:** bản hệ thống tại thời điểm 30/9/2026 và bản tại 11/11/2026  
**Địa bàn minh họa:** nội đô Hà Nội (giao hàng chặng cuối)

---

## 1. Mục đích giai đoạn

Giai đoạn này tập trung chuyển hệ thống từ hướng **điều phối nội bộ doanh nghiệp vận tải** sang hướng **hỗ trợ quản lý quy định giao thông – logistics đô thị**, phục vụ cơ quan quản lý, doanh nghiệp và nghiên cứu trên cùng một bộ dữ liệu vùng, giờ cấm và loại xe.

---

## 2. Hiện trạng trước giai đoạn (cuối tháng 9/2026)

Hệ thống đã có các chức năng: quản lý đơn hàng, tuyến, phương tiện; phân quyền người dùng; tính khí thải khi hoàn thành chuyến; khai thác bản đồ hạn chế giao thông.

Hạn chế so với yêu cầu đề tài:

- Giao diện và luồng thao tác còn theo mô hình vận hành doanh nghiệp, chưa tách rõ vai trò cơ quan quản lý / nghiên cứu / công khai.
- Chưa cho phép cơ quan **ban hành, chỉnh sửa quy định trên bản đồ** (vùng, đoạn đường, phường) kèm loại xe và khung giờ.
- Chưa có công cụ **so sánh tác động chính sách** (hiện trạng so với kịch bản).
- Bề mặt **công khai** và **xuất liệu nghiên cứu** còn mỏng.
- Thiếu đăng xuất, hồ sơ người dùng và bộ giao diện thống nhất theo vai trò.

---

## 3. Nội dung đã thực hiện

### 3.1. Tổ chức lại hệ thống theo vai trò sử dụng

Hệ thống được tổ chức thành các không gian làm việc:

| Vai trò | Chức năng chính |
| --- | --- |
| Cơ quan quản lý | Giám sát; quản lý vùng và quy định; mô phỏng tác động chính sách |
| Doanh nghiệp vận tải | Đội xe; lập tuyến / tối ưu trên quy định đang áp dụng |
| Công khai | Bản đồ vùng – hạn chế; mật độ phản ánh hiện trường |
| Nghiên cứu | Xuất dữ liệu phục vụ phân tích |
| Quản trị hệ thống | Tài khoản, dữ liệu nền |

Bổ sung đăng nhập theo vai trò, đăng xuất, cập nhật hồ sơ.

### 3.2. Quản lý vùng và quy định giao thông – logistics

Trên bản đồ nội đô, cơ quan quản lý thực hiện được:

- Xem vùng (quận/phường, khu hạn chế khí thải, khu hạn chế) và các đoạn cấm/hạn chế đang lưu.
- Tạo phạm vi theo ba cách: vẽ đa giác, chọn đoạn phố, gắn theo phường.
- Gắn quy định: phạm vi, loại phương tiện (xe máy xăng, xe máy điện, ba gác, xe tải), khung giờ, mức độ (cấm / hạn chế / khung được phép), căn cứ pháp lý, mô tả.
- Sửa, xóa quy định; nhập vùng từ tệp bản đồ.
- Tra cứu danh sách quy định (tìm kiếm, phân trang).
- Xem thông tin vùng khi chọn trên bản đồ.

Kết quả: quy định “chỗ nào – xe nào – giờ nào” được lưu thống nhất, dùng chung cho lập tuyến và mô phỏng.

### 3.3. Mô phỏng tác động chính sách

So sánh **phương án A (hiện trạng)** và **phương án B (kịch bản)**. Nhu cầu giao hàng giữ nguyên; thay đổi cách đi và cơ cấu phương tiện.

Đòn bẩy kịch bản B (bật/tắt độc lập):

1. Cấm xe máy xăng trong vùng hạn chế khí thải: đơn đụng vùng phải né tuyến hoặc chuyển sang xe điện — quãng đường có thể tăng, khí thải giảm.
2. Kéo giờ cấm sớm 30 phút: chồng cao điểm sáng — thời gian tăng, tỷ lệ giao đúng giờ giảm.
3. Giả định 40% xe máy xăng còn lại chuyển điện: khí thải giảm; quãng đường gần như không đổi.

Chỉ số so sánh: tổng quãng đường, thời gian giao ước lượng, khí thải CO₂e, tỷ lệ giao đúng giờ, số đơn trong mẫu, số đơn đụng vùng cấm.

**Phạm vi khoa học của mô hình:** phương án B là **ước lượng trên kết quả A** (đơn mẫu và quy định đang lưu), chưa phải vòng điều phối lại toàn bộ tuyến khi luật thay đổi. Số đơn B bằng A.

### 3.4. Doanh nghiệp vận tải

- Theo dõi đội xe.
- Lập tuyến mẫu trên bộ quy định hiện hành.
- Cảnh báo tuyến đi vào vùng cấm giờ hoặc khu hạn chế khí thải.

### 3.5. Công khai và phản ánh hiện trường

- Bản đồ công khai hiển thị vùng và đường hạn chế.
- Lớp mật độ phản ánh (tắc nghẽn, thiếu điểm dừng, cấm, ngõ hẹp) để đối chiếu quy định với thực tế hiện trường.

### 3.6. Nghiên cứu và quản trị dữ liệu

- Xuất dữ liệu phục vụ phân tích.
- Phân quyền theo vai trò; quản lý tài khoản và dữ liệu nền.

---

## 4. Kết quả có thể trình diễn

1. Đăng nhập cơ quan quản lý; bản đồ Hà Nội với vùng và quy định mẫu (Ba Đình, Hoàn Kiếm, khu hạn chế khí thải, cấm giờ xe tải).
2. Tạo hoặc chỉnh quy định trên bản đồ; kết quả xuất hiện trên danh sách và bản đồ.
3. Chạy mô phỏng A/B; bảng chỉ số đổi theo từng đòn bẩy (cải thiện / suy giảm).
4. Bản đồ công khai kèm mật độ phản ánh.
5. Đăng xuất và cập nhật hồ sơ.

Dữ liệu mang tính minh họa đề tài, không dùng cho điều phối hàng hóa thực tế.

---

## 5. Hạn chế còn lại

- Kịch bản B chưa tối ưu lại toàn bộ tuyến khi thay đổi quy định.
- Một số màn hình phiên bản cũ được chuyển sang luồng mới; thao tác chính nằm ở các phân hệ nêu tại mục 3.
- Mô hình khí thải và đúng giờ còn ở mức ước lượng phục vụ so sánh chính sách, chưa thay thế công cụ mô hình giao thông chuyên sâu.

---

## 6. Nội dung dự kiến giai đoạn tiếp

1. Chạy lại lập tuyến cho phương án B khi đổi quy định (né vùng, đổi giờ giao).
2. Liên kết phản ánh hiện trường với từng quy định để ưu tiên rà soát giờ cấm, phạm vi cấm.
3. Bổ sung bộ biến xuất liệu cho nghiên cứu hành vi né tuyến và chuyển đổi phương tiện.

---

*Hà Nội, ngày 11 tháng 11 năm 2026*

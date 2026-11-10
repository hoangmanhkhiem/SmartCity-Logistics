# Tài liệu thiết kế hệ thống – Nền tảng Logistics Đô thị thông minh v2.0

Nov 10, 2026 · @Khiemm

## 1. Tổng quan

Nền tảng gom dữ liệu logistics chặng cuối ở nội đô Hà Nội về một chỗ. Nguồn dữ liệu gồm khảo sát shipper, doanh nghiệp, cơ quan quản lý, dữ liệu mở (OSM) và dữ liệu giả lập. Dữ liệu được hiển thị trên bản đồ và dashboard, dùng để mô phỏng tuyến giao hàng và tác động của chính sách.

| Mục | Nội dung |
| --- | --- |
| Đề tài | Đề tài cấp Bộ GD&ĐT B2025-GHA-05, chủ nhiệm TS. Nguyễn Thị Vân Hà, Trường ĐH GTVT |
| Mục tiêu (iv) của đề tài | Xây dựng công cụ hỗ trợ kết nối, quản lý và khai thác dữ liệu logistics đô thị cho cơ quan quản lý và doanh nghiệp |
| Sản phẩm cam kết | (1) Website demo kết nối, hiển thị dữ liệu tổng hợp; (2) Web app truy xuất, cập nhật dữ liệu, phục vụ quản lý, theo dõi và phân tích |
| Phạm vi địa lý | Các phường nội đô Hà Nội (sau sáp nhập): Hoàn Kiếm, Cửa Nam, Cầu Giấy, Đống Đa, Giảng Võ, Ba Đình; có thể mở rộng sau |
| Người dùng | Cơ quan quản lý, doanh nghiệp giao hàng/logistics, shipper, nhóm nghiên cứu, giảng viên và sinh viên, công chúng |
| Ngoài phạm vi | Điều phối đơn hàng thật, thanh toán, theo dõi GPS thật của shipper, thay thế app Grab/GHN |

Vì sao cần hệ thống này: bài báo Smart City của đề tài kết luận rằng Hà Nội bị quản lý chia cắt, dữ liệu không liên thông, và đề xuất đặt "Data & Platform" làm trung tâm. Hệ thống này là bản mẫu cho đề xuất đó, áp dụng cho lĩnh vực logistics chặng cuối.

Tài liệu này hợp nhất Tài liệu hệ thống v1.0 (05/10/2025), bảng hỏi shipper (draft), thư ngỏ doanh nghiệp và Đặc tả chức năng mở rộng.

## 2. Tác nhân và phân quyền

Hệ thống có 6 vai trò thay cho 10 role của bản trước. Phân biệt rõ 3 thứ:

- **Vai trò:** bạn là ai trong hệ thống.
- **Cấp trong tổ chức:** dùng cho doanh nghiệp, gồm Quản trị DN và Nhân viên.
- **Nhiệm vụ:** việc được giao tạm thời, ví dụ khảo sát phường X.

Vì vậy khảo sát không còn là một role: bất kỳ tài khoản nào được nhóm nghiên cứu giao nhiệm vụ đều làm được. Dữ liệu doanh nghiệp được cô lập theo `organization_id`, lọc bắt buộc ở tầng truy vấn của API.

| Vai trò (mã) | Gồm những ai | Làm được gì |
| --- | --- | --- |
| Khách (`guest`) | Người không đăng nhập | Xem website công khai: bản đồ tổng hợp, chỉ số phường, kết quả nghiên cứu |
| Thành viên (`member`) | Mọi tài khoản đã đăng ký: shipper, sinh viên, cộng tác viên, người dân | Bản đồ đầy đủ, cảnh báo cấm đường/cấm giờ, báo điểm nghẽn/điểm đỗ, sandbox mô phỏng; thực hiện nhiệm vụ khảo sát nếu được giao |
| Doanh nghiệp (`org_admin`, `org_staff`) | Nhân sự của công ty giao hàng, logistics, nền tảng app | Quản trị DN: hồ sơ DN, kho, đội xe, người dùng của DN, API key. Nhân viên: đơn hàng, tối ưu tuyến, theo dõi, báo cáo của DN |
| Cơ quan quản lý (`regulator`) | Sở ngành, trung tâm điều hành giao thông, UBND phường | Giám sát hạ tầng và phát thải, quản lý zone/quy định, mô phỏng chính sách, xem số liệu tổng hợp của DN |
| Nghiên cứu (`researcher`) | Chủ nhiệm đề tài, thành viên nhóm, giảng viên | Giao nhiệm vụ khảo sát, duyệt dữ liệu, xuất SPSS/SmartPLS, xem toàn bộ dashboard, tạo kịch bản giảng dạy |
| Quản trị hệ thống (`sys_admin`) | Nhóm CNTT | Người dùng, tổ chức, cấu hình, dữ liệu nền (OSM, ranh giới), nhật ký |

Ma trận quyền. Ký hiệu:

- **W** = đọc và ghi
- **R** = chỉ đọc
- **O** = chỉ dữ liệu của tổ chức mình
- **A** = chỉ số liệu tổng hợp đã ẩn danh
- **T** = chỉ khi có nhiệm vụ được giao
- — = không có quyền

| Module | Khách | Thành viên | DN – Quản trị | DN – Nhân viên | Cơ quan QL | Nghiên cứu | Quản trị HT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bản đồ & lớp dữ liệu | A | R | R | R | R | R | W |
| Facility (kho, hub, điểm) | A | R | O-W | O-R | R | R | W |
| Đội xe & phát thải | — | — | O-W | O-R | A | R | W |
| Đơn hàng & tối ưu tuyến | — | W (sandbox) | O-W | O-W | A | R | W |
| Zone & quy định | R | R | R | R | W | R | W |
| Điểm đỗ & phản ánh nghẽn | A | W (gửi) | R | R | R | W (duyệt) | W |
| Khảo sát & hiện trường | — | T | T | T | A | W (giao, duyệt) | W |
| Hồ sơ đối tác DN | — | — | O-W | O-R | A | R | W |
| Báo cáo, KPI, CO₂e | A | A | O-R | O-R | R | R | R |
| Mô phỏng chính sách | — | W (sandbox) | — | — | W | W | W |
| Xuất dữ liệu nghiên cứu | A (dataset mở) | — | — | — | — | W | W |
| Người dùng, API key | — | — | O-W | — | — | — | W |

Đối chiếu role cũ → mới, để đọc các mục use-case và API:

- `admin` → Quản trị HT
- `carrier_mgr`, `partner` → DN – Quản trị
- `dispatcher` → DN – Nhân viên
- `shipper`, `student` → Thành viên
- `surveyor` → nhiệm vụ khảo sát (bảng SURVEY\_ASSIGNMENT)
- `lecturer` → Nghiên cứu
- `public` → Khách

Sàn TMĐT không có tài khoản đăng nhập; sàn tích hợp qua API key scope `demand.write`.

## 3. Yêu cầu chức năng

Có 20 nhóm chức năng và 63 yêu cầu. Cột giai đoạn khớp với lộ trình ở mục 12: GĐ1 thu dữ liệu, GĐ2 hiển thị, GĐ3 phân tích và tối ưu, NC nâng cao. Bản demo nghiệm thu (MVP) gồm GĐ1 đến GĐ3. Mã câu hỏi như 2.4 hay F2 trỏ tới bảng hỏi shipper.

| Mã | Yêu cầu | Giai đoạn | Nguồn dữ liệu |
| --- | --- | --- | --- |
| **FR1** | **Bản đồ & lớp dữ liệu** |  |  |
| FR1.1 | Bản đồ nền + lớp facility (hub, kho, trạm sạc/xăng, bus, ga) theo bbox/bán kính | GĐ2 | OSM |
| FR1.2 | Lọc theo loại, công suất, tổ chức, khoảng cách | GĐ2 | — |
| FR1.3 | Bật/tắt lớp đường, ranh giới phường mới, LEZ, quy định; có chú giải | GĐ2 | OSM, ranh giới hành chính mới |
| FR1.4 | Tìm địa chỉ/toạ độ; chia sẻ link view (permalink) | GĐ2 | Nominatim/Photon (OSM) |
| **FR2** | **Facility** |  |  |
| FR2.1 | CRUD facility: MFC, DC, hub, `waiting_point`, `pickup_shop`, `locker` | GĐ1 | Khảo sát DN, 2.1–2.3 |
| FR2.2 | Trạm sạc, trạm đổi pin xe máy điện, cây xăng | GĐ2 | OSM, dữ liệu mở, 3.5 |
| FR2.3 | Import/Export CSV/GeoJSON, kiểm tra EPSG:4326 | GĐ1 | — |
| **FR3** | **Đội xe & phát thải** |  |  |
| FR3.1 | CRUD vehicle: loại (xe máy xăng/điện, xe đạp điện, ba gác, van, tải nhẹ), tải trọng, nhiên liệu, `owner_type` | GĐ1 | Khảo sát DN, 3.1 |
| FR3.2 | Hệ số phát thải theo loại xe/nhiên liệu (gCO₂e/km), tiêu chuẩn Euro | GĐ2 | Quy định nhà nước, tài liệu |
| FR3.3 | Đồng bộ đội xe qua API `carrier-sync` | NC | API doanh nghiệp |
| **FR4** | **Đơn hàng & giả lập** |  |  |
| FR4.1 | Tạo đơn: điểm lấy/giao, time window, khối lượng, loại (food/express/parcel), SLA | GĐ3 | 1.4, 4.4 |
| FR4.2 | Sinh đơn giả lập theo tham số từ FR16 (đơn/giờ, giờ cao điểm, bán kính) | GĐ3 | FR16 |
| FR4.3 | Import đơn CSV, báo lỗi từng dòng | GĐ3 | — |
| **FR5** | **Tối ưu tuyến (VRP)** |  |  |
| FR5.1 | Gọi solver CVRPTW, đầu ra route/leg/stop | GĐ3 | OR-Tools |
| FR5.2 | Vẽ tuyến, bảng lộ trình ETA/quãng đường/thời gian | GĐ3 | OSRM |
| FR5.3 | Ràng buộc: LEZ, cấm giờ, tải trọng, ngõ nhỏ, thời gian tìm chỗ đỗ, mưa; chèn điểm sạc | GĐ3 | FR8, 3.2, 3.4, 4.6, 5.4 |
| FR5.4 | Lưu kế hoạch, so sánh A/B, export | NC | — |
| **FR6** | **Telemetry giả lập** |  |  |
| FR6.1 | Phát luồng vị trí giả lập theo tuyến, cảnh báo trễ | NC | FR5, FR16 |
| FR6.2 | Bản đồ realtime (10–30 s) | NC | — |
| **FR7** | **Báo cáo & KPI** |  |  |
| FR7.1 | % đúng giờ, tổng km, km rỗng, năng lượng, CO₂e, thời gian tìm chỗ đỗ, mức áp lực shipper | GĐ2 | FR5, 3.3, 4.5 |
| FR7.2 | Biểu đồ, heatmap, lọc thời gian/khu vực, xuất CSV | GĐ2 | — |
| **FR8** | **Zone & quy định** |  |  |
| FR8.1 | Vẽ/nhập polygon; khai báo LEZ, cấm giờ, tải trọng, chiều cao theo loại xe; ngày hiệu lực | GĐ2 | Nhóm tra cứu luật |
| FR8.2 | Áp ràng buộc vào solver, hiển thị phạm vi ảnh hưởng | GĐ3 | — |
| **FR9** | **Người dùng, RBAC, API key** |  |  |
| FR9.1 | Quản trị người dùng, 6 vai trò + cấp trong tổ chức (mục 2) | GĐ1 | — |
| FR9.2 | API key theo scope, hiển thị 1 lần, thu hồi | GĐ3 | — |
| FR9.3 | Cô lập dữ liệu theo `organization_id` trên bảng nhạy cảm | GĐ1 | — |
| **FR10** | **Dữ liệu & tích hợp** |  |  |
| FR10.1 | Import OSM → road\_segment (một chiều, tốc độ, loại đường) | GĐ2 | OSM (Geofabrik Vietnam) |
| FR10.2 | Ma trận thời gian/khoảng cách từ OSRM, cache theo bbox | GĐ3 | OSRM |
| FR10.3 | ETL sang các bảng tổng hợp agg\_\* trong MySQL cho báo cáo | NC | — |
| **FR11** | **Trung tâm dữ liệu khảo sát** |  |  |
| FR11.1 | Import Google Form (5 bộ phiếu), mapping câu hỏi → trường, báo lỗi theo dòng | GĐ1 | Google Forms |
| FR11.2 | Mã điểm khảo sát `NỀN TẢNG_PHƯỜNG_STT` + GPS | GĐ1 | 1.3 |
| FR11.3 | Form di động cho điều tra viên: GPS, hiện trường F1–F5, ảnh G1–G4, nhập offline | GĐ1 | — |
| FR11.4 | Dashboard tiến độ theo phường/nhóm/nền tảng | GĐ2 | — |
| FR11.5 | Duyệt phiếu, lọc phiếu rác và trùng | GĐ1 | — |
| FR11.6 | Xuất dữ liệu đã mã hoá cho SPSS/SmartPLS kèm codebook | GĐ2 | — |
| **FR12** | **Điểm dừng/đỗ & điểm chờ đơn** |  |  |
| FR12.1 | Lớp điểm tập kết/chờ đơn | GĐ2 | 2.2, 2.3, F1 |
| FR12.2 | Thuộc tính: loại, mức khó đỗ, xung đột giao thông, hạ tầng, mức hữu ích | GĐ2 | 2.1, 2.4, 3.2, F2–F4 |
| FR12.3 | Phân loại hợp pháp / không / chưa xác minh | GĐ3 | Quy định đỗ xe |
| FR12.4 | Shipper đề xuất điểm mới, duyệt trước khi công khai | NC | Crowdsourcing |
| FR12.5 | Gợi ý vị trí điểm giao nhận/locker công cộng | GĐ3 | FR12, FR13, FR15 |
| **FR13** | **Bản đồ điểm nghẽn** |  |  |
| FR13.1 | Heatmap khó khăn theo phường / ô lưới 250 m | GĐ2 | 2.5, 3.4, 4.6, 5.4, F3 |
| FR13.2 | Lọc theo loại khó khăn, khung giờ, loại đơn | GĐ2 | 1.4, 1.7, 4.2 |
| FR13.3 | Chi tiết ô: số phản ánh, ảnh, ghi chú | GĐ2 | F5, G1–G4 |
| FR13.4 | Shipper báo khó khăn 1 chạm | NC | — |
| **FR14** | **Cảnh báo cấm đường/cấm giờ** |  |  |
| FR14.1 | Tra cứu đoạn bị hạn chế theo loại xe + thời điểm | GĐ3 | FR8, 3.1 |
| FR14.2 | Cảnh báo khi tuyến đi qua vùng hạn chế | GĐ3 | — |
| **FR15** | **Dự báo cao điểm** |  |  |
| FR15.1 | Hồ sơ cao điểm phường × khung giờ × loại ngày (thống kê mô tả) | GĐ3 | 1.7, 4.1–4.3 |
| FR15.2 | Dự báo số đơn theo giờ từ số đơn tổng hợp và thời tiết | NC | FR20.4 |
| **FR16** | **Hồ sơ vận hành shipper** |  |  |
| FR16.1 | Hồ sơ ẩn danh theo nền tảng × loại đơn × loại xe | GĐ2 | 1.5–1.7, 4.1, 4.4, 4.5 |
| FR16.2 | Dùng làm tham số giả lập cho FR4.2 và FR6 | GĐ3 | — |
| **FR17** | **Phản hồi về gợi ý tuyến** |  |  |
| FR17.1 | Thống kê mức tin dùng tuyến của app hiện tại | GĐ3 | 5.1–5.3 |
| FR17.2 | Lý do đổi tuyến → trọng số cho solver | GĐ3 | 5.4 |
| FR17.3 | Báo sai vị trí bản đồ | NC | — |
| **FR18** | **Mô phỏng tác động chính sách** |  |  |
| FR18.1 | Kịch bản: mở rộng LEZ, đổi cấm giờ, thêm điểm đỗ, tăng tỷ lệ xe điện | NC | — |
| FR18.2 | So sánh A/B: km, km rỗng, CO₂e, % đúng giờ | NC | FR4.2, FR5, FR16 |
| **FR19** | **Website công khai (sản phẩm cam kết 1)** |  |  |
| FR19.1 | Giới thiệu đề tài, nhóm, đối tác, nguồn dữ liệu | GĐ2 | — |
| FR19.2 | Bản đồ tổng hợp công khai (đã duyệt, ẩn danh) | GĐ2 | FR1, FR12, FR13 |
| FR19.3 | Bảng chỉ số logistics đô thị theo phường | GĐ2 | FR7, FR16 |
| FR19.4 | Kết quả nghiên cứu + tải dataset mở | NC | FR11.6 |
| **FR20** | **Cổng đối tác & sàn TMĐT** |  |  |
| FR20.1 | Doanh nghiệp tự khai hồ sơ (5 nhóm thông tin trong thư ngỏ) | GĐ1 | Thư ngỏ |
| FR20.2 | Chế độ ẩn danh tên doanh nghiệp | GĐ1 | — |
| FR20.3 | Báo cáo so sánh riêng cho đối tác | GĐ3 | FR7 |
| FR20.4 | API nhận số đơn tổng hợp phường × giờ từ sàn/DN | NC | Sàn TMĐT |

## 4. Yêu cầu phi chức năng

Giữ nguyên các chỉ tiêu của v1.0 và thêm 4 chỉ tiêu mới (đánh dấu *mới*) cho phần khảo sát và người dùng di động.

| Mã | Nhóm | Chỉ tiêu đo được |
| --- | --- | --- |
| NFR1.1 | Hiệu năng | Truy vấn “gần tôi” ≤ 300 ms P95 với 100.000 facility (SPATIAL index MySQL) |
| NFR1.2 | Hiệu năng | Tối ưu 50 đơn/10 xe ≤ 60 s (P90, 4 vCPU); 200 đơn/30 xe ≤ 4 phút |
| NFR1.3 | Mở rộng | 200 người xem bản đồ đồng thời, CPU < 70% |
| NFR1.4 | Mở rộng | Solver chạy qua hàng đợi, scale-out thêm worker |
| NFR2.1 | Tin cậy | Uptime web/API ≥ 99,5% trong giai đoạn trình diễn |
| NFR2.2 | Tin cậy | Backup DB hàng ngày; RPO ≤ 24 h, RTO ≤ 2 h |
| NFR2.3 | Tin cậy | Retry có backoff + circuit breaker khi gọi OSRM/solver |
| NFR3.1 | Bảo mật | OIDC/JWT, RBAC ở ứng dụng, lọc theo tổ chức bắt buộc ở tầng repository |
| NFR3.2 | Bảo mật | TLS mọi kết nối; PII tách bảng, mã hoá AEAD, masking trong báo cáo |
| NFR3.3 | Bảo mật | Audit log CRUD/đăng nhập, giữ ≥ 90 ngày |
| NFR4.1 | Chất lượng dữ liệu | Từ chối GeoJSON không phải EPSG:4326 |
| NFR4.2 | Chất lượng dữ liệu | Import kiểm tra cột bắt buộc, kiểu, toạ độ; báo lỗi theo dòng |
| NFR4.3 | Chất lượng dữ liệu | Danh mục (loại facility, nhiên liệu, loại xe, đáp án khảo sát) theo bộ từ vựng cố định |
| NFR4.4 *mới* | Chất lượng dữ liệu | Mỗi bản ghi có `source` (survey / secondary / osm / simulated / partner) và `verified`; báo cáo luôn ghi rõ tỷ lệ dữ liệu giả lập |
| NFR5.1 | Bảo trì | 100% endpoint có OpenAPI 3.1 |
| NFR5.2 | Bảo trì | Log JSON + trace ID; dashboard latency, lỗi, thời gian solver |
| NFR5.3 | Bảo trì | Docker Compose; từ clone đến chạy demo ≤ 30 phút |
| NFR6.1 | UX | Song ngữ vi/en; đơn vị km, kWh, gCO₂e |
| NFR6.2 | UX | Responsive; thao tác chính ≤ 3 click |
| NFR6.3 *mới* | UX di động | Form điều tra viên và màn hình shipper dùng được một tay, chạy trên Android tầm trung, tải trang đầu ≤ 300 KB (câu 5.6: tốn pin, tốn dữ liệu) |
| NFR6.4 *mới* | Offline | Form khảo sát lưu cục bộ khi mất mạng, tự đồng bộ sau (PWA) |
| NFR7.1 | Tuân thủ | Tuân thủ luật bảo vệ dữ liệu cá nhân hiện hành; PII chỉ dùng cho nghiên cứu và giảng dạy |
| NFR7.2 | Tuân thủ | Ghi nguồn và giấy phép dữ liệu mở (OSM ODbL) |
| NFR7.3 *mới* | Tuân thủ | Không thu tên hay số điện thoại shipper; công khai chỉ khi mỗi nhóm thống kê có ≥ 5 phiếu (k-anonymity) |

## 5. Use-case

Có 22 use-case. UC-01 đến UC-14 giữ từ v1.0 (đã gán FR). UC-15 được điền và UC-16 đến UC-22 là use-case mới.

| ID | Tên | Tác nhân | Mục tiêu | Tiền điều kiện | FR |
| --- | --- | --- | --- | --- | --- |
| UC-01 | Tra cứu điểm trung chuyển gần nhất | Công chúng, shipper | Tìm hub, điểm giao nhận, trạm sạc gần vị trí | Cho phép GPS | FR1.1–1.2 |
| UC-02 | Tạo yêu cầu giao/nhận giả lập | Sinh viên, dispatcher | Xem tuyến khả thi giữa 2 điểm | Có facility và đội xe mẫu | FR4.1, FR5.2 |
| UC-03 | CRUD cơ sở logistics | carrier\_mgr, partner | Cập nhật kho, hub, điểm giao nhận | Thuộc tổ chức | FR2.1 |
| UC-04 | Quản lý đội xe | carrier\_mgr, partner | Loại xe, tải trọng, nhiên liệu, hệ số phát thải | Thuộc tổ chức | FR3.1–3.2 |
| UC-05 | Lập kế hoạch tuyến (VRP) | dispatcher | Tối ưu nhiều đơn có time window | Có đơn + xe | FR5.1–5.3 |
| UC-06 | Theo dõi thực thi (giả lập) | dispatcher | Xem vị trí xe, ETA, trễ | Đã có tuyến | FR6 |
| UC-07 | Xem lớp dữ liệu quản lý | regulator | Giám sát hạ tầng logistics đô thị | Quyền regulator | FR1.3 |
| UC-08 | Báo cáo phát thải & KPI | regulator | CO₂e, % đúng giờ, km rỗng theo phường | Có dữ liệu tuyến | FR7 |
| UC-09 | Quản lý vùng/quy định | regulator | Thiết lập LEZ, cấm giờ, tải trọng | Quyền regulator | FR8 |
| UC-10 | Quản trị người dùng & vai trò | admin | Phân quyền, khoá/mở | Tài khoản admin | FR9.1 |
| UC-11 | Quản lý API key | admin, carrier\_mgr | Cấp/thu hồi key theo scope | Quyền `api.manage` | FR9.2 |
| UC-12 | Đồng bộ dữ liệu doanh nghiệp | Hệ thống DN | Đẩy đội xe/đơn qua API | Có API key | FR3.3 |
| UC-13 | Import dữ liệu học liệu | lecturer | Nạp bộ dữ liệu mẫu | File chuẩn | FR2.3, FR4.3 |
| UC-14 | Mô phỏng kịch bản giảng dạy | lecturer, student | Chạy kịch bản giờ cao điểm, LEZ, xe điện | Có dataset | FR4.2, FR5 |
| UC-15 | Gửi số đơn tổng hợp | Sàn TMĐT (API) | Cung cấp nhu cầu theo phường × giờ, không chứa thông tin người mua | API key `demand.write` | FR20.4 |
| UC-16 | Nhập phiếu khảo sát tại hiện trường | surveyor | Ghi phiếu shipper + F1–F5 + ảnh, kể cả khi mất mạng | Được giao khu vực | FR11.2–11.3 |
| UC-17 | Import & duyệt kết quả Google Form | researcher | Đưa phiếu vào DB, loại phiếu lỗi | Có file CSV | FR11.1, 11.5 |
| UC-18 | Xuất dữ liệu phân tích | researcher | File cho SPSS/SmartPLS + codebook | Phiếu đã duyệt | FR11.6 |
| UC-19 | Xem điểm đỗ & cảnh báo cấm đường | shipper | Biết chỗ đỗ và đoạn cấm theo loại xe, giờ hiện tại | — | FR12.1, FR14 |
| UC-20 | Báo điểm nghẽn / điểm đỗ mới | shipper | Góp dữ liệu từ hiện trường | Cho phép GPS | FR12.4, FR13.4 |
| UC-21 | Tự khai hồ sơ doanh nghiệp & nhận báo cáo | partner | Cập nhật dữ liệu, xem so sánh với ngành | Đã ký đồng ý chia sẻ | FR20.1–20.3 |
| UC-22 | Mô phỏng tác động chính sách | regulator, researcher | So sánh trước/sau khi đổi quy định | Có hồ sơ vận hành FR16 | FR18 |

## 6. Kiến trúc hệ thống

Hệ thống dùng kiến trúc **modular monolith + worker**: một API NestJS chia module, các tác vụ nặng (tối ưu tuyến, import, giả lập) chạy nền qua hàng đợi. Toàn bộ chạy trên 1 VPS 4 vCPU / 8 GB bằng Docker Compose. So với v1.0 (microservice phân tán, Kafka, ClickHouse), cách này nhẹ hơn nhiều cho quy mô demo mà vẫn tách được thành service sau này.

&#91;embedded content: kiến trúc triển khai · 4 loại client, 1 API, 3 dịch vụ nền, tầng dữ liệu\]

Client chỉ gọi qua Nginx → API. API ghi công việc vào hàng đợi, Worker xử lý và gọi Optimizer khi cần tối ưu tuyến. Optimizer lấy ma trận khoảng cách từ OSRM. Tầng dữ liệu không mở ra Internet.

| Thành phần | Vai trò | Công nghệ | Thay đổi so v1.0 |
| --- | --- | --- | --- |
| Web | Website công khai + web app + PWA di động trong một codebase | Next.js, MapLibre GL, Tailwind, next-intl | Leaflet → MapLibre (vector tile, heatmap mượt hơn) |
| API | Xác thực, phân quyền, CRUD, khảo sát, GIS, báo cáo | NestJS, REST + OpenAPI 3.1, TypeORM | Gộp Gateway + Auth + GIS thành module; bỏ GraphQL ở MVP |
| Hàng đợi | Xếp việc nặng, retry có backoff | Redis + BullMQ | Thay Kafka |
| Worker | ETL OSM, import CSV/Google Form, sinh đơn giả lập, tính hồ sơ FR16 | Node.js (BullMQ) | Giữ |
| Optimizer | Giải CVRPTW có ràng buộc LEZ, cấm giờ, tải trọng | Python, FastAPI, OR-Tools | Giữ |
| OSRM | Ma trận thời gian/khoảng cách, vẽ tuyến | OSRM, extract Hà Nội từ OSM | Chỉ cắt vùng Hà Nội cho nhẹ RAM; bỏ GraphHopper |
| CSDL | Dữ liệu lõi + không gian (POINT/LINESTRING/POLYGON SRID 4326), bảng tổng hợp báo cáo | MySQL 8.0 (InnoDB, spatial) | Dùng MySQL thay PostgreSQL; thay ClickHouse bằng bảng tổng hợp do Worker làm mới |
| Lưu trữ tệp | Ảnh hiện trường, GeoJSON, file xuất, bản đồ nền PMTiles | MinIO (S3) | Thêm PMTiles |
| Giám sát | Metric, log, cảnh báo | Prometheus, Grafana, Loki | Giữ |

Khi nào nên tách thành microservice: khi có hơn 1 máy chủ, hoặc khi doanh nghiệp đẩy dữ liệu liên tục qua API. Ranh giới module đã khớp với các service trong v1.0 nên tách không cần viết lại.

## 7. Luồng dữ liệu

Dữ liệu đi qua 6 bước theo một chiều. Mỗi bản ghi luôn mang nhãn nguồn (`source`) nên báo cáo nào cũng biết bao nhiêu phần là số liệu thật, bao nhiêu phần là giả lập.

1. **Thu thập**, 5 nguồn:
   - Khảo sát sơ cấp: Google Form (5 bộ phiếu) và PWA của điều tra viên (`source = survey`).
   - Dữ liệu thứ cấp qua website: danh sách công ty, kho, điểm gửi hàng, khung dữ liệu phường (`secondary`).
   - Doanh nghiệp tự khai qua cổng đối tác hoặc API (`partner`).
   - Dữ liệu mở: OSM (đường, POI, trạm xăng), ranh giới phường (`osm`).
   - Văn bản quy định: cấm giờ, cấm đường, LEZ, do nhóm tra cứu luật nhập vào (`regulation`).
2. **Chuẩn hoá và kiểm tra** (Worker): map đáp án về bộ từ vựng cố định, geocode địa chỉ và tên phố, kiểm tra toạ độ nằm trong ranh giới Hà Nội, đánh dấu trùng. Lỗi được trả về theo từng dòng.
3. **Duyệt** (researcher): phiếu và điểm đồng góp chuyển `verified = true`. Chỉ dữ liệu đã duyệt mới đi tiếp sang bước 4.
4. **Tổng hợp** (bảng tổng hợp do Worker tính lại theo lịch hoặc sau mỗi lần duyệt):
   - Hồ sơ vận hành shipper (FR16), hồ sơ cao điểm (FR15).
   - Heatmap điểm nghẽn theo ô 250 m và theo phường (FR13).
   - Chỉ số theo phường cho website (FR19.3). Chỉ công khai khi nhóm có ≥ 5 phiếu.
5. **Giả lập và tối ưu**: sinh đơn từ hồ sơ (FR4.2, `simulated`) → OSRM tính ma trận → OR-Tools giải VRP với ràng buộc zone/quy định → ghi route/leg/stop → tính km, CO₂e, % đúng giờ.
6. **Khai thác**:
   - Website công khai và dashboard trong web app.
   - Báo cáo cho đối tác.
   - Kết quả mô phỏng chính sách.
   - File xuất cho SPSS/SmartPLS, dùng cho bài báo và báo cáo đề tài.

## 8. Thiết kế cơ sở dữ liệu (MySQL 8.0)

CSDL gồm 40 bảng chia 5 nhóm, chạy trên MySQL 8.0, engine InnoDB, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`. Truy vấn không gian dùng kiểu spatial có sẵn của MySQL, không cần extension.

**Quy ước kiểu dữ liệu:**

- **Khoá chính:** `id BINARY(16)`, lưu UUID v7. Giá trị tăng theo thời gian nên chèn vào index B-tree không bị phân mảnh. TypeORM chuyển đổi qua transformer. Khoá ngoại cùng kiểu.
- **Không gian:** `POINT`, `LINESTRING`, `MULTIPOLYGON` khai báo `NOT NULL SRID 4326` kèm `SPATIAL INDEX`. MySQL chỉ dùng spatial index khi cột có SRID và NOT NULL. Hàm hay dùng: `ST_Distance_Sphere` (gần tôi), `ST_Contains` / `MBRContains` (điểm thuộc phường), `ST_Intersects` (tuyến đi qua LEZ).
- **Lưu ý thứ tự toạ độ:** với SRID 4326, MySQL hiểu WKT theo thứ tự *vĩ độ trước, kinh độ sau*. Luôn ghi bằng `ST_GeomFromGeoJSON` hoặc `ST_GeomFromText(wkt, 4326, 'axis-order=long-lat')` để không bị đảo toạ độ.
- **Mảng và dữ liệu linh hoạt:** cột `JSON`. Cần lọc theo mảng (VD: loại xe bị cấm) thì dùng multi-valued index `CAST(col AS CHAR(32) ARRAY)`. Quan hệ nhiều-nhiều cần truy vấn thường xuyên thì tách thành bảng nối.
- **Danh mục cố định:** `ENUM`. Thang Likert dùng `TINYINT` kèm `CHECK (x BETWEEN 1 AND 5)`.
- **Thời gian:** `DATETIME(3)` lưu UTC; hiển thị theo Asia/Ho\_Chi\_Minh.
- **Trường chung** (không nhắc lại ở từng bảng): `id`, `created_at`, `updated_at`, `created_by`. Bảng nghiệp vụ có thêm `source ENUM(survey, secondary, partner, osm, regulation, simulated)`, `verified TINYINT(1)` và `organization_id` (kèm index) để cô lập dữ liệu.

### 8.1. Tổ chức, người dùng, phân quyền

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| ORGANIZATION | `name VARCHAR(255)`, `short_name`, `type ENUM(carrier, delivery_platform, ecommerce, shipper_business, regulator, university)`, `business_sector`, `tax_code VARCHAR(20)`, `website`, `address`, `hq_geom POINT SRID 4326 NULL`, `contact_name`, `contact_email_enc VARBINARY`, `contact_phone_enc VARBINARY`, `is_partner`, `anonymize_public`, `consent_at` | Liên hệ mã hoá AES-GCM ở ứng dụng. `hq_geom` cho phép NULL nên không đánh spatial index |
| CARRIER | `organization_id`, `name`, `brand`, `service_types JSON` (express, food, parcel, ride), `fleet_model ENUM(own_fleet, gig_platform, hybrid)`, `fleet_size INT`, `warehouse_count INT`, `warehouse_area_m2 DECIMAL(10,1)`, `monthly_shipments_band`, `service_area MULTIPOLYGON SRID 4326 NULL`, `delivery_slots JSON`, `has_driver_app` | Nguồn là thư ngỏ và form DN |
| USER | `full_name`, `email VARCHAR(255) UNIQUE`, `phone_enc`, `auth_provider ENUM(local, oidc, anonymous)`, `password_hash`, `oidc_sub`, `status ENUM(active, locked)`, `locale`, `last_login_at` | Shipper có thể dùng tài khoản ẩn danh |
| MEMBERSHIP | `user_id`, `organization_id`, `role_id`, `valid_from`, `valid_to`; UNIQUE(`user_id`, `organization_id`, `role_id`) |  |
| SURVEY\_ASSIGNMENT | `user_id`, `zone_id` | Nhiệm vụ khảo sát, giao được cho bất kỳ tài khoản nào (thay role surveyor). Thêm form\_id, quota (số phiếu), due\_date, status ENUM(open, done, cancelled), assigned\_by |
| ROLE | `code VARCHAR(32) UNIQUE`, `name`, `description` | 6 vai trò ở mục 2 |
| PERMISSION | `code` (VD: `facility.write`), `resource`, `action ENUM(read, write, delete, approve, export)` |  |
| ROLE\_PERMISSION | `role_id`, `permission_id`; PK kép | Bảng nối |
| API\_KEY | `organization_id`, `name`, `key_hash CHAR(64)`, `scopes JSON`, `ip_allowlist JSON`, `last_used_at`, `revoked_at` | Chỉ lưu SHA-256 |
| REFRESH\_TOKEN | `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent_hash` | Thu hồi được |
| AUDIT\_LOG | `actor_id`, `action`, `entity`, `entity_id`, `diff JSON`, `ip_hash`, `at`; partition theo tháng | Giữ ≥ 90 ngày, xóa bằng `DROP PARTITION` |

### 8.2. Không gian và hạ tầng

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| ZONE | `code`, `name`, `kind ENUM(ward, legacy_district, lez, restricted_area, grid_cell, study_area)`, `parent_id`, `admin_code`, `boundary MULTIPOLYGON NOT NULL SRID 4326` + SPATIAL INDEX, `area_km2`, `population`, `effective_from` | Phường mới là đơn vị chính |
| ROAD\_SEGMENT | `osm_id BIGINT`, `name`, `highway_class`, `geom LINESTRING NOT NULL SRID 4326` + SPATIAL INDEX, `one_way`, `lanes TINYINT`, `max_speed_kmh`, `width_class ENUM(main, street, lane, alley)`, `zone_id` | `alley` = ngõ nhỏ (FR5.3) |
| RESTRICTION | `road_segment_id` hoặc `zone_id`, `rule ENUM(ban, time_window, max_weight, max_height, lez)`, `vehicle_types JSON` + multi-valued index, `time_from TIME`, `time_to TIME`, `days_of_week JSON`, `max_weight_t`, `max_height_m`, `legal_ref`, `effective_from DATE`, `effective_to DATE` | `CHECK` bắt buộc có đúng 1 trong 2 khoá ngoại |
| FACILITY | `organization_id`, `name`, `kind ENUM(dc, mfc, hub, pickup_shop, waiting_point, locker, parking_point, charging, swap_station, fuel)`, `geom POINT NOT NULL SRID 4326` + SPATIAL INDEX, `address`, `zone_id`, `area_m2`, `capacity`, `opening_hours JSON`, `legal_status ENUM(legal, illegal, unverified)`, `parking_difficulty_avg DECIMAL(3,2)`, `traffic_conflict`, `report_count`, `meta JSON` | Truy vấn “gần tôi”: lọc bbox bằng `MBRContains` (dùng index) rồi xếp theo `ST_Distance_Sphere` |
| CHARGER | `facility_id`, `type ENUM(ac, dc, battery_swap)`, `connector_type`, `power_kw`, `slots`, `price_per_kwh`, `vehicle_class ENUM(two_wheel, four_wheel)` |  |
| FUEL\_PUMP | `facility_id`, `fuel_type`, `price_per_l`, `price_updated_at` |  |
| DOCK | `facility_id`, `capacity`, `max_vehicle_class` |  |

### 8.3. Vận hành, đơn hàng, tuyến

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| VEHICLE | `carrier_id`, `type ENUM(motorbike_ice, motorbike_ev, ebike, cargo_trike, van, light_truck)`, `owner_type ENUM(company, gig)`, `plate_masked`, `unit_count INT`, `capacity_kg`, `capacity_m3`, `fuel_type`, `emission_standard`, `emission_factor_id`, `range_km`, `is_electric` | `unit_count` dùng cho đội xe khai tổng hợp |
| EMISSION\_FACTOR | `vehicle_type`, `fuel_type`, `g_co2e_per_km DECIMAL(8,2)`, `g_co2e_per_kwh`, `source_ref`, `valid_from` |  |
| `ORDER` (đặt tên bảng `orders`) | `organization_id`, `external_ref`, `order_type ENUM(food, express, parcel)`, `pickup_geom POINT NOT NULL SRID 4326`, `delivery_geom POINT NOT NULL SRID 4326`, `pickup_zone_id`, `delivery_zone_id`, `tw_start`, `tw_end`, `weight_kg`, `volume_m3`, `sla_minutes`, `status ENUM(pending, planned, in_transit, delivered, failed)` | `ORDER` là từ khoá SQL nên đổi tên thành `orders` |
| SHIPMENT | `order_id`, `weight_kg`, `volume_m3`, `parcel_count` |  |
| PLAN | `organization_id`, `scenario_id`, `solver_params JSON`, `status ENUM(queued, running, done, failed)`, `objective_value`, `runtime_ms` |  |
| ROUTE | `plan_id`, `vehicle_id`, `mode`, `geom LINESTRING SRID 4326 NULL`, `total_km`, `empty_km`, `duration_min`, `energy_kwh`, `fuel_l`, `co2e_g`, `on_time_ratio` | KPI FR7 |
| LEG | `shipment_id`, `route_id`, `sequence`, `from_facility_id`, `to_facility_id`, `distance_km` |  |
| STOP | `leg_id`, `facility_id` hoặc `geom POINT SRID 4326 NULL`, `type ENUM(pickup, delivery, transit, charge)`, `eta`, `arrival`, `departure`, `dwell_min`, `parking_search_min` |  |
| ASSIGNMENT | `vehicle_id`, `leg_id`, `assigned_at` |  |
| TELEMETRY | `vehicle_id`, `route_id`, `ts DATETIME(3)`, `lat DECIMAL(9,6)`, `lon DECIMAL(9,6)`, `speed_kmh`, `battery_pct`, `is_simulated`; partition theo ngày | Lưu lat/lon số thay vì POINT để ghi nhanh; chỉ dữ liệu giả lập |
| SCENARIO | `name`, `kind ENUM(teaching, policy)`, `base_plan_id`, `changes JSON`, `kpis JSON` | FR18 |

### 8.4. Khảo sát

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| SURVEY\_FORM | `code ENUM(shipper, last_mile_company, platform, logistics_company, regulator)`, `version`, `question_map JSON` | Mapping câu hỏi Google Form → cột |
| SURVEY\_SITE | `site_code VARCHAR(32) UNIQUE`, `platform`, `zone_id`, `geom POINT NOT NULL SRID 4326`, `surveyor_id`, `visited_at` | VD: `GRAB_BD_01` |
| SURVEY\_RESPONSE | `form_id`, `site_id`, `organization_id`, `answers_raw JSON`, `status ENUM(draft, submitted, approved, rejected)`, `reject_reason`, `submitted_at`, `approved_by` | Giữ bản gốc |
| SHIPPER\_ANSWER | `response_id` (PK), `is_active_shipper`, `platform`, `order_types JSON`, `tenure_band`, `frequency`, `active_slots JSON`, `main_area`, `zone_ids JSON`, `urban_type`, `pickup_type`, `has_waiting_point`, `waiting_point_text`, `wp_usefulness TINYINT`, `wp_issues JSON`, `vehicle_type`, `parking_difficulty TINYINT`, `parking_impact TINYINT`, `urban_issues JSON`, `charging_issue`, `orders_per_day_band`, `peak_slots JSON`, `peak_impact TINYINT`, `expected_sla_band`, `time_pressure TINYINT`, `disruption_effects JSON`, `app_route`, `follow_route`, `route_saving TINYINT`, `reroute_reasons JSON`, `wanted_features JSON`, `adoption_barriers JSON`, `km_per_order_band`, `pickup_wait_band` | Cột Likert 1–5 có `CHECK`. Khi xuất cho SPSS, mỗi mảng JSON tách thành biến 0/1 |
| FIELD\_OBSERVATION | `site_id`, `has_parking`, `parking_difficulty TINYINT`, `traffic_conflict`, `infra_fit TINYINT`, `note TEXT`, `photo_keys JSON`, `observed_at`, `surveyor_id` | F1–F5, G |
| ISSUE\_REPORT | `reporter_hash CHAR(64)`, `issue_type ENUM(congestion, ban, no_parking, alley, weather, map_error, other)`, `geom POINT NOT NULL SRID 4326` + SPATIAL INDEX, `zone_id`, `cell_id`, `occurred_at`, `note`, `photo_key`, `status ENUM(new, approved, rejected)` | `cell_id` (ô lưới 250 m) do Worker tính lúc ghi |

### 8.5. Tổng hợp và phân tích

MySQL không có materialized view. Các bảng `agg_*` dưới đây do Worker tính lại theo lịch (BullMQ repeatable job) hoặc sau mỗi lần duyệt phiếu. Mỗi lần tính ghi vào bảng tạm rồi `RENAME TABLE` để đổi ngay, không khoá người đang đọc.

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| OPERATION\_PROFILE | `platform`, `order_type`, `vehicle_type`, `n_responses`, `orders_per_day_dist JSON`, `sla_dist JSON`, `active_slot_dist JSON`, `time_pressure_mean` | FR16 |
| PEAK\_PROFILE | `zone_id`, `slot`, `day_type ENUM(normal, rain, holiday)`, `intensity`, `n` | FR15.1 |
| DEMAND\_AGG | `organization_id`, `zone_id`, `hour_bucket DATETIME`, `order_type`, `order_count`; UNIQUE(`organization_id`, `zone_id`, `hour_bucket`, `order_type`) | FR20.4, upsert `ON DUPLICATE KEY UPDATE` |
| `agg_bottleneck_grid` | `cell_id`, `issue_type`, `slot`, `count`, `top_issue`, `refreshed_at` | FR13.1 |
| `agg_zone_kpi` | `zone_id`, `facility_count`, `parking_difficulty_avg`, `ev_share`, `peak_slot`, `co2e_per_order`, `n_responses`, `refreshed_at` | FR19.3; chỉ công khai khi `n_responses` ≥ 5 |

**Cô lập dữ liệu theo tổ chức.** MySQL không có Row-Level Security, nên việc cô lập làm ở tầng ứng dụng, gồm 3 lớp:

1. Mọi repository của bảng nhạy cảm (CARRIER, VEHICLE, `orders`, PLAN, ROUTE, TELEMETRY, SURVEY\_RESPONSE, DEMAND\_AGG) kế thừa một `TenantScopedRepository`. Lớp này tự thêm `WHERE organization_id = :orgId` lấy từ JWT. Không có orgId thì ném lỗi, không trả rỗng.
2. Chỉ `admin` và `researcher` được gọi hàm `unscoped()`. Mỗi lần gọi đều ghi AUDIT\_LOG.
3. Ở tầng DB, API dùng user `app_rw` (chỉ SELECT/INSERT/UPDATE/DELETE, không DDL). Website công khai dùng user `app_public` chỉ được SELECT trên các bảng `agg_*` và view công khai. Test tích hợp bắt buộc có ca “DN A không đọc được dữ liệu DN B”.

## 9. API chính

REST tại `/api/v1`, mô tả bằng OpenAPI 3.1. Endpoint công khai chỉ trả dữ liệu đã duyệt và ẩn danh. Các tác vụ nặng trả về `job_id` để client hỏi lại kết quả.

| Module | Endpoint | Quyền | FR |
| --- | --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me` | Mọi người | FR9.1 |
| Người dùng | `GET/POST/PATCH /users`, `POST /users/{id}/lock`, `GET/POST/DELETE /api-keys` | admin, carrier\_mgr (tổ chức mình) | FR9 |
| Bản đồ | `GET /facilities?bbox=&kind=&near=lat,lon&radius=`, `GET /zones?kind=`, `GET /restrictions?at=&vehicle_type=`, `GET /geocode?q=` | Theo mục 2 | FR1, FR14.1 |
| Facility | `POST/PATCH/DELETE /facilities`, `POST /facilities/import` (CSV/GeoJSON) | carrier\_mgr, partner, admin | FR2 |
| Đội xe | `GET/POST/PATCH /vehicles`, `GET /emission-factors`, `POST /ingest/carrier-sync` | carrier\_mgr, partner; API key | FR3 |
| Đơn hàng | `POST /orders`, `POST /orders/import`, `POST /orders/simulate` → `job_id` | dispatcher, student (sandbox) | FR4 |
| Tối ưu | `POST /plans` → `job_id`, `GET /plans/{id}`, `GET /plans/{id}/routes.geojson`, `POST /plans/compare` | dispatcher, researcher | FR5 |
| Zone & quy định | `POST/PATCH /zones`, `POST/PATCH /restrictions` | regulator, admin | FR8 |
| Khảo sát | `POST /surveys/{form}/responses`, `POST /surveys/{form}/import`, `PATCH /responses/{id}/review`, `GET /surveys/progress`, `GET /surveys/{form}/export?format=spss\|csv` | surveyor, researcher | FR11 |
| Hiện trường | `POST /sites`, `POST /sites/{id}/observations`, `POST /uploads/presign` (ảnh lên MinIO) | surveyor | FR11.3 |
| Phản ánh | `POST /issues`, `PATCH /issues/{id}/review`, `GET /bottlenecks?grid=250&slot=&type=` | shipper; researcher duyệt | FR12.4, FR13 |
| Phân tích | `GET /profiles/operation`, `GET /profiles/peak?zone=`, `GET /kpi?zone=&from=&to=` | Theo mục 2 | FR7, FR15, FR16 |
| Mô phỏng | `POST /scenarios` → `job_id`, `GET /scenarios/{id}/result` | regulator, researcher, lecturer | FR18 |
| Đối tác | `GET/PUT /partner/profile`, `GET /partner/report` | partner | FR20.1–20.3 |
| Nhu cầu | `POST /ingest/demand` (phường × giờ × số đơn) | API key `demand.write` | FR20.4 |
| Công khai | `GET /public/map-layers`, `GET /public/zone-kpi`, `GET /public/datasets` | public | FR19 |
| Jobs | `GET /jobs/{id}` (trạng thái, tiến độ, kết quả) | Người tạo job | NFR1.4 |
| Hệ thống | `GET /health`, `GET /ready`, `GET /metrics` (nội bộ) | — | NFR5 |

## 10. Bảo mật và tuân thủ

Giữ nguyên các biện pháp OWASP Top 10 của v1.0, chỉ điều chỉnh cho khớp kiến trúc mới. Thêm phần bảo vệ dữ liệu khảo sát, vì đây là nơi duy nhất hệ thống chạm tới dữ liệu về người thật.

| Rủi ro | Biện pháp |
| --- | --- |
| Truy cập trái phép / IDOR | Guard RBAC ở mọi route NestJS; mọi truy vấn bắt buộc lọc theo `organization_id`; kiểm tra quyền sở hữu trước mọi PATCH/DELETE |
| Lộ dữ liệu khi truyền/lưu | TLS 1.3 + HSTS; mã hoá đĩa (LUKS) cho volume DB và MinIO; trường liên hệ mã hoá AEAD ở tầng ứng dụng |
| Xác thực | JWT RS256, access token 15 phút, refresh token lưu DB, thu hồi được; MFA cho admin và regulator; khoá tạm sau 5 lần sai |
| Injection | Chỉ dùng TypeORM QueryBuilder có tham số; validate DTO bằng class-validator; kiểm tra GeoJSON bằng schema |
| SSRF | Chỉ Worker được gọi ra ngoài, qua allowlist (Google Sheets API, Geofabrik). Chặn IP nội bộ và metadata |
| Upload độc hại | Upload qua presigned URL; giới hạn MIME (jpeg, png, csv, geojson) và dung lượng 10 MB; bỏ EXIF GPS của ảnh trước khi công khai; hash SHA-256 |
| Cấu hình sai | Deny-all firewall, chỉ mở 22/80/443; DB, Redis, MinIO chỉ trong mạng Docker nội bộ; container chạy non-root, read-only filesystem khi có thể |
| Thư viện lỗi thời | CI chạy `npm audit`, `pip-audit`, Trivy, Semgrep; Dependabot |
| Lạm dụng API | Rate limit ở Nginx theo IP và theo API key; API key có scope + IP allowlist |
| Giám sát | Log JSON không chứa PII thô → Loki; cảnh báo 5xx, đăng nhập sai hàng loạt qua Alertmanager → email |

**Bảo vệ dữ liệu khảo sát và shipper:**

- Không thu tên, số điện thoại hay biển số của shipper. Phiếu chỉ gắn với mã điểm khảo sát.
- Đầu form có câu đồng ý tham gia. Ảnh chỉ chụp khi được phép và không chụp rõ mặt hoặc biển số.
- Vị trí phản ánh của shipper được làm mờ ±50 m trước khi công khai. Người báo cáo chỉ lưu dạng hash.
- Ngưỡng công khai: mỗi nhóm thống kê (phường × nền tảng…) phải có ≥ 5 phiếu.
- Dữ liệu doanh nghiệp: công khai dạng ẩn danh “DN A, DN B” nếu doanh nghiệp chọn; số liệu chi tiết chỉ đối tác đó và nhóm nghiên cứu xem được.
- Lưu trữ: dữ liệu thô giữ đến hết thời gian thực hiện đề tài cộng 12 tháng, sau đó chỉ giữ bản đã ẩn danh. Mốc thời gian cần chủ nhiệm đề tài xác nhận.
- Căn cứ pháp lý: v1.0 đang dẫn NĐ 13/2023/NĐ-CP. Luật Bảo vệ dữ liệu cá nhân 2025 có hiệu lực từ 01/01/2026, nên nhóm tra cứu luật cần xác nhận văn bản hiện hành và cập nhật Privacy Notice cho đúng.

## 11. Hạ tầng và triển khai

Toàn bộ hệ thống chạy trên 1 VPS: Ubuntu 22.04, 4 vCPU, 8 GB RAM, 100 GB SSD (đúng cấu hình v1.0), dùng Docker Compose. Bỏ Kafka và ClickHouse, đồng thời cắt OSRM chỉ vùng Hà Nội, nên cấu hình này đủ chạy.

| Service (Compose) | Image / công nghệ | RAM giới hạn (ước lượng) | Ghi chú |
| --- | --- | --- | --- |
| `nginx` | Nginx + Certbot | 128 MB | Cổng duy nhất mở ra Internet |
| `web` | Next.js (standalone) | 512 MB |  |
| `api` | NestJS | 768 MB | Chạy migration khi khởi động |
| `worker` | Node + BullMQ | 512 MB | ETL, import, giả lập |
| `optimizer` | Python FastAPI + OR-Tools | 1 GB | Giới hạn thời gian giải theo NFR1.2 |
| `osrm` | osrm-backend, profile xe máy tự chỉnh | 1 GB | Extract Hà Nội từ Geofabrik Vietnam, build MLD |
| `db` | MySQL 8.0 (InnoDB) | 2 GB | Chỉ mạng nội bộ |
| `redis` | Redis 7 | 256 MB | Hàng đợi + cache |
| `minio` | MinIO | 512 MB | Ảnh, file xuất, PMTiles bản đồ nền |
| `monitoring` | Prometheus, Grafana, Loki, Alertmanager | 1 GB | Grafana chỉ truy cập qua VPN/SSH tunnel |

Môi trường: `local` (Docker Compose trên máy dev, dữ liệu mẫu), `staging` và `production` (cùng VPS hoặc 2 VPS, tách database).

Quy trình triển khai:

1. Chuẩn bị VPS: user `deploy` không phải root, SSH key, tắt đăng nhập bằng mật khẩu, UFW deny-all (mở 22/80/443), cài Docker Engine + Compose.
2. Tên miền và TLS: Let’s Encrypt qua Certbot. Nginx bật HSTS 1 năm, CSP, X-Frame-Options DENY, nosniff.
3. Secrets: `.env` nằm ngoài repo (`/etc/app/env`, chmod 600). JWT private key tách riêng.
4. CI (GitHub Actions) mỗi pull request chạy: lint, test, `npm audit`, `pip-audit`, Semgrep, build image, Trivy, cập nhật OpenAPI spec.
5. Phát hành: tag `vX.Y.Z+YYYYMMDD` → push image lên registry → trên VPS chạy `docker compose pull && docker compose up -d` → API tự chạy migration → healthcheck `/api/v1/health`, `/ready`.
6. Nạp dữ liệu nền (1 lần): ranh giới phường, OSM → road\_segment + facility, build OSRM, tạo PMTiles bản đồ nền Hà Nội.
7. Kiểm tra hiệu năng với k6: khoảng 100 req/s cho API bản đồ và bài 50 đơn/10 xe của NFR1.2.

Backup:

- `mysqldump --single-transaction` hàng ngày, giữ 7 bản.
- Restic mã hoá sao lưu ra kho ngoài VPS, gồm dump DB và bucket MinIO.
- Thử khôi phục 1 lần mỗi tháng (RPO ≤ 24 h, RTO ≤ 2 h).

## 12. Lộ trình, phạm vi MVP và câu hỏi mở

Bản demo nghiệm thu (MVP) = giai đoạn 1 đến 3. Đến hết giai đoạn 2 là đã đủ 2 sản phẩm cam kết trong thư ngỏ. Chưa có mốc ngày; cần chốt theo thời hạn nghiệm thu của đề tài.

| Giai đoạn | Mục tiêu | Chức năng | Xong khi |
| --- | --- | --- | --- |
| GĐ1 – Thu dữ liệu | Có chỗ nhập và lưu dữ liệu khảo sát, doanh nghiệp | FR2.1, FR2.3, FR3.1, FR9.1, FR9.3, FR11.1–11.3, FR11.5, FR20.1–20.2 | Điều tra viên nhập được phiếu trên điện thoại; import được toàn bộ Google Form hiện có |
| GĐ2 – Hiển thị | Website công khai + web app dữ liệu (2 sản phẩm cam kết) | FR1, FR2.2, FR3.2, FR7, FR8.1, FR10.1, FR11.4, FR11.6, FR12.1–12.2, FR13.1–13.3, FR16.1, FR19.1–19.3 | Bản đồ có đủ lớp cho 6 phường khảo sát; xuất được file cho SmartPLS |
| GĐ3 – Phân tích & tối ưu | Chứng minh giá trị tối ưu tuyến trong bối cảnh nội đô | FR4.1–4.3, FR5.1–5.3, FR8.2, FR9.2, FR10.2, FR12.3, FR12.5, FR14, FR15.1, FR16.2, FR17.1–17.2, FR20.3 | Chạy được kịch bản 50 đơn/10 xe có ràng buộc cấm giờ và ra KPI CO₂e |
| NC – Nâng cao | Mở rộng sau nghiệm thu | FR3.3, FR5.4, FR6, FR10.3, FR12.4, FR13.4, FR15.2, FR17.3, FR18, FR19.4, FR20.4 | — |

Câu hỏi mở cần chốt với cô Vân Hà và các nhóm:

- [ ] Hạn nghiệm thu sản phẩm ứng dụng của đề tài là khi nào? (để đặt mốc ngày cho từng giai đoạn)
- [ ] “Website demo” và “web app” trong thuyết minh là 2 sản phẩm tách biệt hay chấp nhận 1 hệ thống có 2 cổng?
- [ ] Phạm vi địa lý chốt là 6 phường khảo sát hay toàn nội đô?
- [ ] Tên miền và VPS dùng của trường, của đề tài hay thuê riêng? Ai là chủ sở hữu dữ liệu?
- [ ] Nhóm khảo sát có thêm 2 câu (quãng đường mỗi đơn, thời gian chờ lấy hàng) và đổi câu 1.9 sang phường mới không?
- [ ] Nhóm tra cứu luật cung cấp danh sách cấm giờ, cấm đường, LEZ dạng bảng (tuyến, loại xe, khung giờ, số văn bản) để nhập RESTRICTION.
- [ ] Hệ số phát thải theo loại xe lấy từ nguồn nào (quy định nhà nước hay tài liệu quốc tế)?
- [ ] Có doanh nghiệp nào đã đồng ý làm đối tác và chia sẻ dữ liệu chưa?

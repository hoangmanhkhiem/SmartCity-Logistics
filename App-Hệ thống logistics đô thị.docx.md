# **TÀI LIỆU HỆ THỐNG**

Dự án: Hệ Thống Logistics Đô Thị

Phiên bản: 1.0

Ngày phát hành: 05/10/2025

Người soạn thảo: Hoàng Mạnh Khiêm, Lê Nam Thắng

# **MỤC LỤC** {#mục-lục}

[**MỤC LỤC	2**](#mục-lục)

[**1\. Tổng quan hệ thống	5**](#1.-tổng-quan-hệ-thống)

[1.1. Yêu cầu chức năng	5](#1.1.-yêu-cầu-chức-năng)

[1.1.1. FR1 – Quản lý bản đồ & lớp dữ liệu	5](#1.1.1.-fr1-–-quản-lý-bản-đồ-&-lớp-dữ-liệu)

[1.1.2. FR2 – Cơ sở logistics (Facility)	5](#1.1.2.-fr2-–-cơ-sở-logistics-\(facility\))

[1.1.3. FR3 – Đội xe & phát thải	5](#1.1.3.-fr3-–-đội-xe-&-phát-thải)

[1.1.4. FR4 – Đơn hàng & kịch bản giả lập	5](#1.1.4.-fr4-–-đơn-hàng-&-kịch-bản-giả-lập)

[1.1.5. FR5 – Tối ưu tuyến & định tuyến (VRP)	6](#fr4.3:-nhập-order-từ-csv-\(mẫu\),-trả-báo-cáo-lỗi-từng-dòng,-tải-lại-file-sửa.)

[1.1.6. FR6 – Telemetry & giám sát (giả lập)	6](#1.1.6.-fr6-–-telemetry-&-giám-sát-\(giả-lập\))

[1.1.7. FR7 – Báo cáo & KPI	6](#1.1.7.-fr7-–-báo-cáo-&-kpi)

[1.1.8. FR8 – Vùng/quy định (Zone & Restriction)	6](#1.1.8.-fr8-–-vùng/quy-định-\(zone-&-restriction\))

[1.1.9. FR9 – Người dùng, RBAC, API Key	6](#1.1.9.-fr9-–-người-dùng,-rbac,-api-key)

[1.1.10. FR10 – Dữ liệu & tích hợp	7](#1.1.10.-fr10-–-dữ-liệu-&-tích-hợp)

[1.2. Yêu cầu phi chức năng	7](#1.2.-yêu-cầu-phi-chức-năng)

[1.2.1. NFR1 – Hiệu năng & khả năng mở rộng	7](#1.2.1.-nfr1-–-hiệu-năng-&-khả-năng-mở-rộng)

[1.2.2. NFR2 – Độ tin cậy & sẵn sàng	7](#1.2.2.-nfr2-–-độ-tin-cậy-&-sẵn-sàng)

[1.2.3. NFR3 – Bảo mật & quyền riêng tư	7](#1.2.3.-nfr3-–-bảo-mật-&-quyền-riêng-tư)

[1.2.4. NFR4 – Tính khả dụng dữ liệu & chất lượng dữ liệu	8](#1.2.4.-nfr4-–-tính-khả-dụng-dữ-liệu-&-chất-lượng-dữ-liệu)

[1.2.5. NFR5 – Khả năng bảo trì & vận hành	8](#1.2.5.-nfr5-–-khả-năng-bảo-trì-&-vận-hành)

[1.2.6. NFR6 – Khả dụng quốc tế & UX	8](#1.2.6.-nfr6-–-khả-dụng-quốc-tế-&-ux)

[1.2.7. NFR7 – Tuân thủ & pháp lý (tham khảo)	8](#1.2.7.-nfr7-–-tuân-thủ-&-pháp-lý-\(tham-khảo\))

[1.3. Phạm vi MVP (tóm tắt)	9](#1.3.-phạm-vi-mvp-\(tóm-tắt\))

[**2\. Kiến trúc hệ thống	9**](#2.-kiến-trúc-hệ-thống)

[2.1. Sơ đồ C4:	9](#2.1.-sơ-đồ-c4:)

[2.1.1. C4 Context	9](#2.1.1.-c4-context)

[2.1.2. C4 Container	10](#2.1.2.-c4-container)

[2.2. Bảng mô tả use-case	11](#2.2.-bảng-mô-tả-use-case)

[**3\. Cơ sở dữ liệu	14**](#3.-cơ-sở-dữ-liệu-=\>-định-nghĩa-trường-dữ-liệu-và-từ-đó-yêu-cầu-thêm-trường-dữ-liệu)

[3.1. ORGANIZATION	14](#3.1.-organization-=\>-lưu-trữ-thông-tin-của-1-tổ-chức-nào-đó,-cần-định-nghĩa-organization,-và-yêu-cầu-dữ-liệu-cần-lấy-=\>-có-thể-bổ-sung)

[3.2. CARRIER	15](#3.2.-carrier-=\>-lưu-trữ-thông-tin-của-1-đv-vận-tải-nào-đó,-cần-định-nghĩa-carrier,-và-yêu-cầu-dữ-liệu-cần-lấy-=\>-có-thể-bổ-sung)

[3.3. VEHICLE	15](#3.3.-vehicle-lưu-trữ-thông-tin-của-pt-vận-tải-nào-đó,-cần-định-nghĩa-pt,-và-yêu-cầu-dữ-liệu-cần-lấy-=\>-có-thể-bổ-sung)

[3.4.FACILITY	15](#3.4.facility)

[3.5. CHARGER	16](#3.5.-charger)

[3.6. FUEL\_PUMP	16](#3.6.-fuel_pump)

[3.7.DOCK	17](#3.7.dock)

[3.8. ZONE	17](#3.8.-zone)

[3.9.ROAD\_SEGMENT	17](#3.9.road_segment)

[3.10.RESTRICTION	18](#3.10.restriction-=\>-phụ-thuộc-vào-tuyến-đường)

[3.11.ORDER	18](#3.11.order-=\>-bổ-sung-yêu-cầu)

[3.12. SHIPMENT	19](#3.12.-shipment-=\>-đóng-theo-lô-hàng-=\>-ghom-hàng)

[3.13. LEG	19](#3.13.-leg-=\>-chặng-vận-chuyển,-tuyến-đường-của-lô-hàng-\(các-node,-điểm-trung-chuyển\))

[3.14.STOP	20](#3.14.stop)

[3.15. ROUTE	20](#3.15.-route)

[3.16. TELEMETRY	20](#3.16.-telemetry)

[3.17. ASSIGNMENT	21](#3.17.-assignment)

[3.18. USER	21](#3.18.-user-=\>-cần-bổ-sung)

[3.19. MEMBERSHIP	22](#3.19.-membership-=\>-quyến-ưu-tiên-theo-membership)

[3.20. ROLE	22](#3.20.-role)

[3.21. PERMISSION	23](#3.21.-permission)

[**4\. Bảo mật và tuân thủ	23**](#4.-bảo-mật-và-tuân-thủ)

[4.1. Kiến trúc bảo mật tổng quan	23](#4.1.-kiến-trúc-bảo-mật-tổng-quan)

[4.2. Tuân thủ OWASP Top 10 theo từng tầng	23](#4.2.-tuân-thủ-owasp-top-10-theo-từng-tầng)

[4.2.1.  Broken Access Control / IDOR	23](#4.2.1.-broken-access-control-/-idor)

[4.2.2. Cryptographic Failures	24](#4.2.2.-cryptographic-failures)

[4.2.3. Injection (SQL, NoSQL, Command)	24](#4.2.3.-injection-\(sql,-nosql,-command\))

[4.2.4. Insecure Design / SSRF	24](#4.2.4.-insecure-design-/-ssrf)

[4.2.5. Security Misconfiguration	25](#4.2.5.-security-misconfiguration)

[4.2.6. Vulnerable & Outdated Components	25](#4.2.6.-vulnerable-&-outdated-components)

[4.2.7. Identification & Authentication Failures	26](#4.2.7.-identification-&-authentication-failures)

[4.2.8.  Software & Data Integrity Failures	26](#4.2.8.-software-&-data-integrity-failures)

[4.2.9. Security Logging & Monitoring Failures	26](#4.2.9.-security-logging-&-monitoring-failures)

[4.2.10. Server-Side Request Forgery (SSRF)	27](#4.2.10.-server-side-request-forgery-\(ssrf\))

[4.3. Bảo mật tầng Edge & Gateway	27](#4.3.-bảo-mật-tầng-edge-&-gateway)

[4.4. Privacy & Tuân thủ pháp lý	28](#4.4.-privacy-&-tuân-thủ-pháp-lý)

[4.5. Kiểm thử & Giám sát bảo mật	28](#4.5.-kiểm-thử-&-giám-sát-bảo-mật)

[4.6. Chính sách DevSecOps	29](#4.6.-chính-sách-devsecops)

[4.7. Luồng bảo mật microservice	30](#4.7.-luồng-bảo-mật-microservice)

[**5\. Hạ tầng & Triển khai	30**](#5.-hạ-tầng-&-triển-khai)

[5.1. Hạ tầng	30](#5.1.-hạ-tầng)

[5.1.1. Kiến trúc mạng	30](#5.1.1.-kiến-trúc-mạng)

[5.1.2. Triển khai VPS	31](#5.1.2.-triển-khai-vps)

[5.1.3. Bảo mật	32](#5.1.3.-bảo-mật)

[5.1.4. Backup	32](#5.1.4.-backup)

[5.2. Triển khai	33](#5.2.-triển-khai)

[5.2.1. Chuẩn bị môi trường	33](#5.2.1.-chuẩn-bị-môi-trường)

[5.2.2. Cấu hình ban đầu	34](#5.2.2.-cấu-hình-ban-đầu)

[5.2.3. Build & Phát hành	34](#5.2.3.-build-&-phát-hành)

# **1\. Tổng quan hệ thống** {#1.-tổng-quan-hệ-thống}

## **1.1. Yêu cầu chức năng** {#1.1.-yêu-cầu-chức-năng}

*Mã hóa FR-xx, đánh dấu MVP cho phạm vi bản demo giai đoạn 1\.*

### **1.1.1. FR1 – Quản lý bản đồ & lớp dữ liệu** {#1.1.1.-fr1-–-quản-lý-bản-đồ-&-lớp-dữ-liệu}

* FR1.1 (MVP): Hiển thị bản đồ nền \+ lớp facility (hub, trung chuyển, trạm sạc/xăng) theo bbox/radius. \=\> lấy data mã nguồn mở \=\> Thẻ 1/Thẻ 2 (lấy được khu vực bản đồ, trạm xăng, trạm buýt, và trạm kết nối đường sắt,…) \=\> Khiêm kiểm tra xem có lấy được DL từ mã nguồn mở không?  
* FR1.2 (MVP): Bộ lọc theo kind, capacity, organization/carrier, và theo khoảng cách từ vị trí người dùng.  
* FR1.3: Bật/tắt các lớp road\_segment, zone (LEZ/quận), restriction với legend và mô tả thuộc tính (lưu ý xem bản đồ đã cập nhật theo địa lý sáp nhật mới chưa, có ranh giới địa lý chưa?? \=\>Khiêm xem nguồn dữ liệu mở nào được sử dụng???)  
* FR1.4: Tìm kiếm theo địa chỉ/toạ độ; sao chép liên kết chia sẻ view (permalink) \=\> tìm kiếm địa chỉ người gửi/người nhận (có thể dùng api mở…của nguồn nào \=\> Khiêm xác nhận) 

### **1.1.2. FR2 – Cơ sở logistics (Facility)** {#1.1.2.-fr2-–-cơ-sở-logistics-(facility)}

* FR2.1 (MVP): CRUD facility (tên, loại, toạ độ, công suất, giờ mở cửa, meta) theo phân quyền: kho nhỏ (Micro fulfiment center MFC) trong nội đô; hay dùng DC ở ngoại ô: Cty cung cấp dịch vụ giao hàng chặng cuối/CPN/Logistics \=\> đi khảo sát \=\> lập bảng khảo sát (đối tượng là các công ty giao hàng chặng cuối): MFC, DC, Quy mô, Diện tích, Địa điểm, 20 công ty \=\> lập bảng \=\> fill có thông tin có sắn, nhặt dữ liệu thứ cấp, khảo sát, \=\> lấy dữ liệu sơ cấp (Nhóm của P.Thảo)  
* FR2.2: Quản lý charger (loại chân sạc, công suất kW, số khe, giá/kWh) và fuel\_pump (loại nhiên liệu, giá/lít): Trạm sạc dùng cho xe điện (xe máy, xe ô tô) \=\> trạm sạc (có thể là các trạm xăng hiện tại) hoặc trạm sạc mới, việc thu thập dữ liệu trạm sạc (Dữ liệu mở của Vin, dựa trên network mà Vin cung cấp cho người mua xe Vinfast). Tuy nhiên việc mô hình trạm sạc thành điểm trung chuyển không khả thi vì diện tích nhỏ, dễ cháy nổ \=\> Có thể tích hợp vào hệ thống app nếu đủ dữ liệu (còn không để ở tính năng nâng cao).   
* FR2.3: Import/Export facility bằng CSV/GeoJSON; kiểm tra CRS 4326, validate cột bắt buộc.

### **1.1.3. FR3 – Đội xe & phát thải** {#1.1.3.-fr3-–-đội-xe-&-phát-thải}

* FR3.1 (MVP): CRUD vehicle (tải trọng, volume, nhiên liệu, hệ số phát thải, phạm vi). Các thông tin về loại xe và yêu cầu cập nhật về phát thải. Khảo sát các đơn vị CPN/GHCH: Hỏi về số lượng xe, tài trọng, mức độ phát thải, nhiên liệu \=\> lựa chọn xe vận chuyển, tối ưu chi phí, mức độ phát thải…Trong trường hợp không có dữ liệu sơ cấp cũng phải tính phương án giả lập từ số liệu trung bình thực tiễn do nhóm Thảo thu thập được từ nguồn thứ cấp.   
* FR3.2: Thiết lập hệ số phát thải theo loại phương tiện/fuel; đơn vị (gCO₂e/km, gCO₂e/kWh). Nhóm Phương Thảo: Tra cứu Quy định cập nhật mới về chủng loại xe, hệ số phát thải theo phương tiện (QĐ của Nhà nước)  
* FR3.3: Đồng bộ đội xe từ carrier qua API POST /ingest/carrier-sync (batch upsert; báo cáo lỗi theo dòng).

### **1.1.4. FR4 – Đơn hàng & kịch bản giả lập** {#1.1.4.-fr4-–-đơn-hàng-&-kịch-bản-giả-lập}

* FR4.1 (MVP): Tạo order với pickup/delivery (geom), time window, khối lượng/khối tích, SLA. \=\> Có thể lấy số liệu theo số liệu thực tiễn thu thập được từ DN (sàn TMĐT, công ty GHCC) hoặc phải Giả lập số liệu này, về đơn hàng có những thông số ước lượng như thế nào \=\> nhập đơn hàng \=\> Tốc độ giao hàng phụ thuộc vào nhiều yếu tô (khung giờ giao hàng, số lượng, ….) dự báo trong tương lai.  
* FR4.2: Sinh dữ liệu order giả lập theo phân phối tham số (số đơn/giờ, bán kính, giờ cao điểm).  
* FR4.3: Nhập order từ CSV (mẫu), trả báo cáo lỗi từng dòng, tải lại file sửa.

  Chỉ cần lấy một số liệu trung bình để giả lập (lấy được nhiều dữ liệu càng nhiều càng tốt)

### **1.1.5. FR5 – Tối ưu tuyến & định tuyến (VRP)**

* FR5.1 (MVP): Gọi solver CVRPTW: đầu vào vehicles, jobs, ràng buộc; đầu ra route/leg/stop.  
* FR5.2 (MVP): Vẽ tuyến trên bản đồ (thuật toán, cấm đường, cầm giờ tắc đường); bảng lộ trình có ETA/distance/duration. \=\> có quyền tracking đường đi \=\> có quyền theo dõi định vị GPS trên các xe vận chuyển, hoặc giả lập dựa vào thời gian sinh ra từ FR4 (thời gian từ người gửi đi đến người nhận \=\> vận tốc trung bình)  
* FR5.3: Ràng buộc phụ: LEZ, cấm giờ, giới hạn tải/cầu; chèn điểm charge/fuel tự động.  
* FR5.4: Lưu kế hoạch, xem lại, so sánh phương án (A/B) và export GeoJSON/CSV.

\=\> Cung đường bị cấm, giờ cấm, \=\> Nhóm Thảo tra cứu quy định về vận chuyển trong thành phối \=\> Nội đô \=\> Nhặt dữ liệu

### **1.1.6. FR6 – Telemetry & giám sát (giả lập)** {#1.1.6.-fr6-–-telemetry-&-giám-sát-(giả-lập)}

* FR6.1: Phát luồng vị trí giả lập cho xe chạy theo route; cập nhật ETA, cảnh báo trễ/sai lộ trình.  
* FR6.2: Bản đồ realtime (10–30s refresh) \+ bảng xe đang hoạt động.

\=\> Tình huống giả lập cho FR5. (định vị mô phỏng theo tuyến đường của mình, loại được độ trễ) \=\> chấm tròn đang chạy, xe đang hoạt động đi từ đâu???

### **1.1.7. FR7 – Báo cáo & KPI** {#1.1.7.-fr7-–-báo-cáo-&-kpi}

* FR7.1: Bảng chỉ số: on‑time %, tổng km, km rỗng, năng lượng tiêu thụ, CO₂e theo carrier/vehicle/zone.  
* FR7.2: Xuất CSV; biểu đồ (đường/cột/heatmap) và widget lọc theo thời gian/khu vực.

Có thể dùng dữ liệu thực hoặc dữ liệu giả lập

### **1.1.8. FR8 – Vùng/quy định (Zone & Restriction)** {#1.1.8.-fr8-–-vùng/quy-định-(zone-&-restriction)}

* FR8.1: Vẽ/nhập polygon zone; khai báo quy định (LEZ, cấm giờ, tải trọng, chiều cao).  
* FR8.2: Áp ràng buộc vào solver và hiển thị phạm vi ảnh hưởng trên bản đồ.

\=\> Kế thừa FR5, hoặc giả lập hoặc số liệu Vùng cấm xe xăng ở các khu vực nào; hoặc cấm giờ, cấm xe, 

### **1.1.9. FR9 – Người dùng, RBAC, API Key** {#1.1.9.-fr9-–-người-dùng,-rbac,-api-key}

* FR9.1 (MVP): Quản trị người dùng (tạo/khoá/mở) \+ gán vai trò: admin, regulator, carrier\_mgr, dispatcher, student, viewer. \=\> rất nhiều đối tượng: Admin, người dùng, đv vận chuyển \=\> bộ phân quyền tính năng khác nhau, dùng tính năng nào không cho phép dùng tính năng nào. Nhưng tác nhân đến hệ thống \=\> đưa ra DS tác nhân tác động ảnh hưởng để hệ thống (Phải phân cấp nhiều hơn, ma trận phân quyền: Quản trị hệ thống/CNTT/Kế toán/Chuyên viên logistics/; Khách hàng, viewer \=\> nhiều layer \=\> clear hơn)  
* FR9.2: Tạo API key theo scope (facility.read, vrp.run, …), chỉ hiển thị 1 lần khi tạo; thu hồi.  
* FR9.3: RLS theo organization\_id/carrier\_id trên bảng nhạy cảm (order, vehicle, route, telemetry). \=\> Dự liệu bảo mật của từng khách hàng/nhà cung cấp

### **1.1.10. FR10 – Dữ liệu & tích hợp** {#1.1.10.-fr10-–-dữ-liệu-&-tích-hợp}

* FR10.1 (MVP): Import OSM/GeoJSON đường trục → road\_segment \+ thuộc tính one\_way (làn đường, đường 1 chiều), speed (giới hạn tốc độ; khả năng trên map không có, phải đi tìm nguồn cung cấp)  
* FR10.2: Ma trận chi phí từ OSRM/GraphHopper; cache theo bbox/kỳ hạn. \=\> Dựa vào time, khoảng cách, ràng buộc, \=\> chi phí ước lượng cho dịch vụ cung cấp \=\> advanced (tính năng cao \=\> chưa cần thiết)  
* FR10.3: ETL sang kho phân tích (ClickHouse/DuckDB) tạo materialized view báo cáo.

\=\> File data mô phỏng giao thông; thông tin bản đồ, nền bản đồ, phục vụ cho app của mình; lấy từ OSRM (nhưng không chắc…=\> Khiêm kiểm tra…)

\=\> Ma trận chi phí xây dựng ở mức sơ bộ 

## **1.2. Yêu cầu phi chức năng** {#1.2.-yêu-cầu-phi-chức-năng}

*Mã hóa NFR‑xx, gắn tiêu chí đo lường (measurable) khi có thể.*

### **1.2.1. NFR1 – Hiệu năng & khả năng mở rộng** {#1.2.1.-nfr1-–-hiệu-năng-&-khả-năng-mở-rộng}

* NFR1.1: Truy vấn “điểm gần tôi” (FR1.1) trả ≤ 300ms tại P95 với 100k bản ghi facility, có gist index.  
* NFR1.2: Tối ưu 50 đơn/10 xe trong ≤ 60s (P90) trên máy 4 vCPU; 200 đơn/30 xe ≤ 4 phút.  
* NFR1.3: Hỗ trợ đồng thời 200 người dùng xem map/filters (read‑heavy) với CPU \< 70%.  
* NFR1.4: Tăng tuyến tính khi scale‑out service ops/gis bằng hàng đợi công việc.

### **1.2.2. NFR2 – Độ tin cậy & sẵn sàng** {#1.2.2.-nfr2-–-độ-tin-cậy-&-sẵn-sàng}

* NFR2.1: Uptime dịch vụ web/api ≥ 99.5% trong giai đoạn trình diễn.  
* NFR2.2: Sao lưu DB hàng ngày; RPO ≤ 24h, RTO ≤ 2h cho bản demo.  
* NFR2.3: Retry có backoff cho gọi OSRM/solver; circuit breaker khi lỗi 5xx liên tiếp.

### **1.2.3. NFR3 – Bảo mật & quyền riêng tư** {#1.2.3.-nfr3-–-bảo-mật-&-quyền-riêng-tư}

* NFR3.1: Xác thực OIDC/JWT, RBAC ở app, RLS ở DB cho bảng nhạy cảm.  
* NFR3.2: Mã hoá TLS mọi kết nối; dữ liệu PII tách bảng, mã hoá ở ứng dụng (AEAD), masking trong BI.  
* NFR3.3: Lưu audit log CRUD/đăng nhập; giữ tối thiểu 90 ngày.

### **1.2.4. NFR4 – Tính khả dụng dữ liệu & chất lượng dữ liệu** {#1.2.4.-nfr4-–-tính-khả-dụng-dữ-liệu-&-chất-lượng-dữ-liệu}

* NFR4.1: Validate CRS 4326 cho mọi GeoJSON; từ chối import nếu sai CRS.  
* NFR4.2: Schema import có kiểm tra ràng buộc: cột bắt buộc, kiểu dữ liệu, toạ độ hợp lệ; error report theo dòng.  
* NFR4.3: Chuẩn hoá danh mục kind, fuel, connector\_type theo vocab dựng sẵn; dữ liệu bẩn bị chuẩn hoá/ghi chú.

### **1.2.5. NFR5 – Khả năng bảo trì & vận hành** {#1.2.5.-nfr5-–-khả-năng-bảo-trì-&-vận-hành}

* NFR5.1: 100% endpoint có OpenAPI 3.1; CI lint spec và generate SDK.  
* NFR5.2: Log có cấu trúc (JSON) \+ trace ID; dashboard metrics (latency, error rate, solver time).  
* NFR5.3: Hạ tầng bằng Docker Compose; dev‑onboarding ≤ 30 phút từ clone repo đến chạy demo.

### **1.2.6. NFR6 – Khả dụng quốc tế & UX** {#1.2.6.-nfr6-–-khả-dụng-quốc-tế-&-ux}

* NFR6.1: Hỗ trợ i18n (vi/en) ở UI; định dạng số/đơn vị (km, kWh, gCO₂e).  
* NFR6.2: Bản đồ responsive; thao tác chính ≤ 3 click đạt mục tiêu (use‑case MVP).

### **1.2.7. NFR7 – Tuân thủ & pháp lý (tham khảo)** {#1.2.7.-nfr7-–-tuân-thủ-&-pháp-lý-(tham-khảo)}

* NFR7.1: Tuân thủ luật bảo vệ dữ liệu hiện hành; PII chỉ dùng cho mục đích trình diễn/giảng dạy.  
* NFR7.2: Sử dụng dữ liệu nguồn mở (OSM, open data) theo giấy phép; ghi nguồn ở phần “About/Data sources”.

## **1.3. Phạm vi MVP (tóm tắt)** {#1.3.-phạm-vi-mvp-(tóm-tắt)}

* FR1.1–FR1.2, FR2.1, FR3.1, FR4.1, FR5.1–FR5.2, FR9.1, FR10.1–FR10.2.  
* NFR trọng tâm: NFR1.1, NFR1.2, NFR2.1, NFR3.1, NFR5.1, NFR5.3.

# **2\. Kiến trúc hệ thống** {#2.-kiến-trúc-hệ-thống}

## **2.1. Sơ đồ C4:** {#2.1.-sơ-đồ-c4:}

### **2.1.1. C4 Context** {#2.1.1.-c4-context}

Hệ thống **“Nền tảng Logistics đô thị thông minh”** được xây dựng nhằm quản lý, thu thập và phân tích dữ liệu hạ tầng giao thông đô thị, phục vụ việc tối ưu hoá logistics chặng cuối.

Kiến trúc được thiết kế theo mô hình **microservice phân tán**, trong đó mỗi thành phần đảm nhiệm một vai trò riêng, giao tiếp thông qua API Gateway.

Các tác nhân chính:

* Người tiêu dùng: Tra cứu điểm giao hàng/nhận hàng, trạm sạc, tuyến đường.

* Đơn vị vận chuyển: Quản lý đội xe, trạm, lịch giao hàng (chia sẻ thông tin về khí phát thải, xăng….)

*  Cơ quan quản lý: Theo dõi hạ tầng, thống kê phát thải, phân tích lưu lượng; được quyền chia sẻ dữ liệu với doanh nghiệp logistics/CPN (real time) \=\> họ có tài khoản người giám sát \=\> giám sát (điều khoản bảo mật dữ liệu cá nhân) \=\> advanced yêu cầu nâng cao

* Trường ĐH GTVT: Sử dụng hệ thống cho mục đích nghiên cứu, đào tạo. \=\> advanced yêu cầu nâng cao

??? Vậy các sàn giao dịch thương mại điện tử tham gia vào hệ thống sinh thái logistics đô thị như thế nào.

Các sàn E-commerce như Tiki, Shopee đơn vị cung cấp platform để người mua – người bán gặp nhau??? \=\> Cần xem cơ chế vận hành trên App Demo khi có sự tham gia của các sàn E-commerce \=\> Khiêm xem thêm phần này nhé

### **2.1.2. C4 Container** {#2.1.2.-c4-container}

Hệ thống được thiết kế theo kiến trúc microservice, tách biệt các chức năng chính để dễ dàng mở rộng, triển khai độc lập và đảm bảo khả năng chịu tải.

| Thành phần | Mô tả chức năng | Công nghệ chính |
| ----- | ----- | ----- |
| Web App (Next.js) | Giao diện người dùng, bản đồ, tra cứu thông tin | Next.js, Leaflet, Tailwind |
| API Gateway (NestJS) | Điều phối request, routing tới các service con | NestJS, GraphQL, Swagger 3.1 |
| Auth Service | Xác thực, phân quyền, phát hành JWT | JWT, OIDC, RBAC, RLS |
| Optimization Service | Tối ưu tuyến vận chuyển, tính ETA và phát thải | OR-Tools, Python API |
| GIS Service | Phân tích không gian, routing, khoảng cách | PostGIS, OSRM, GraphHopper |
| ETL Worker | Thu thập, chuẩn hoá dữ liệu khảo sát và nguồn mở | Kafka, CronJob, Node Worker |
| Database (PostgreSQL \+ PostGIS) | Lưu trữ dữ liệu lõi và không gian | PostgreSQL, PostGIS |
| Object Storage (MinIO) | Lưu trữ tệp GeoJSON, ảnh, bản đồ | MinIO, S3-compatible |
| Monitoring Stack | Theo dõi log, metric, cảnh báo | Prometheus, Grafana, Loki |

![][image1]

Người dùng cuối \=\> tác nhân đều phải truy cập qua giao diện 

## **2.2. Bảng mô tả use-case** {#2.2.-bảng-mô-tả-use-case}

| ID | Tên Use Case | Tác nhân | Mục tiêu | Tiền ĐK | Kích hoạt |
| ----- | ----- | ----- | ----- | ----- | ----- |
| UC-01 | Tra cứu điểm trung chuyển gần nhất | Người tiêu dùng | Tìm hub/trạm sạc/xăng gần vị trí để gửi/nhận (xem lại) | Vị trí người dùng cho phép (GPS) | Người dùng mở Map và bấm “Gần tôi” |
| UC-02 | Tạo yêu cầu giao/nhận giả lập (tuyến khả thi) | Người tiêu dùng | Đặt pickup→delivery để xem tuyến khả thi | Hệ thống có sẵn facility/đội xe mẫu | Bấm “Tạo yêu cầu” và nhập thông tin |
| UC-03 | CRUD cơ sở logistics (hub/trung chuyển/trạm sạc/xăng) | Điều phối DN | Cập nhật hạ tầng vận hành của DN | Vai trò Dispatcher/CarrierMgr | Bấm “Thêm/Cập nhật/Xoá” facility |
| UC-04 | Quản lý đội xe | Điều phối DN | Cập nhật phương tiện, tải trọng, nhiên liệu, hệ số phát thải | Có quyền với carrier | Mở module Đội xe |
| UC-05 | Lập kế hoạch tuyến (VRP) | Điều phối DN | Tối ưu nhiều đơn hàng/time window, chọn điểm sạc | Đã có đơn hàng \+ đội xe | Bấm “Tối ưu tuyến” |
| UC-06 | Theo dõi thực thi & telematics | Điều phối DN | Xem vị trí xe, ETA, chậm/đúng hẹn | Có thiết bị/telemetry giả lập | Mở màn hình Realtime |
| UC-07 | Xem bản đồ/lớp dữ liệu quản lý | Cơ quan quản lý | Giám sát hạ tầng logistics đô thị | Có quyền Regulator | Chọn lớp dữ liệu (road, facility, zone) |
| UC-08 | Báo cáo phát thải & KPI | Cơ quan quản lý | Thống kê CO₂e, on-time %, km rỗng theo khu vực | Dữ liệu route/consumption tồn tại | Chọn kỳ báo cáo |
| UC-09 | Quản lý vùng/quy định hạn chế | Cơ quan quản lý | Thiết lập LEZ, cấm giờ, tải trọng | Vai trò Regulator | Tạo/nhập GeoJSON zone \+ rule |
| UC-10 | Quản trị người dùng & vai trò (RBAC) | Quản trị DN/Hệ thống | Phân quyền, khoá/mở user | Có tài khoản admin | Truy cập Admin Console |
| UC-11 | Quản lý API Key tích hợp | Quản trị DN/Hệ thống | Cấp/thu hồi API key, gán scope | RBAC “api.manage” | Bấm “Tạo API Key” |
| UC-12 | Đồng bộ dữ liệu DN (ingest) | Quản trị DN/Hệ thống | Kéo/push dữ liệu đội xe/đơn hàng | Cấu hình endpoint DN | Chạy task “carrier-sync” |
| UC-13 | Import dữ liệu học liệu | Giảng viên | Nạp dữ liệu mẫu: road, facility, orders | File GeoJSON/CSV chuẩn | Chọn “Import” |
| UC-14 | Mô phỏng kịch bản (teaching) | Giảng viên/Sinh viên | Chạy kịch bản giờ cao điểm/LEZ/EV | Có dataset giáo trình | Chọn kịch bản và chạy |
| UC-15 | ?? | Sàn giao dịch TMĐT | ??? | ??? | ??? |

# **3\. Cơ sở dữ liệu \=\> Định nghĩa trường dữ liệu  và từ đó yêu cầu thêm trường dữ liệu** {#3.-cơ-sở-dữ-liệu-=>-định-nghĩa-trường-dữ-liệu-và-từ-đó-yêu-cầu-thêm-trường-dữ-liệu}

## **3.1. ORGANIZATION \=\> Lưu trữ thông tin của 1 tổ chức nào đó, cần định nghĩa organization, và yêu cầu dữ liệu cần lấy \=\> có thể bổ sung** {#3.1.-organization-=>-lưu-trữ-thông-tin-của-1-tổ-chức-nào-đó,-cần-định-nghĩa-organization,-và-yêu-cầu-dữ-liệu-cần-lấy-=>-có-thể-bổ-sung}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính định danh tổ chức |
| name | string | Tên doanh nghiệp hoặc tổ chức |
| type | string | Loại hình tổ chức (doanh nghiệp, cơ quan, trường, ...) |
| business |  | Lĩnh vực hoạt động (Sàn giao dịch E-commerce, Cty CPN, Cty Logistics, DNSX, DNTM, DNDV  |
|  |  |  |

Tuy nhiên nếu đưa ra nội hàm Organization ở đây khá chung chung, Tổ chức ở đây có thể tiếp cận ở những góc độ sau:

- Doanh nghiệp sử dụng dịch vụ giao và nhận hàng hóa (DNSX, DNTM, DNDV)  
- Doanh nghiệp cung cấp sàn giao dịch thương mại điện tử (TIKI, SHOPEE,…) \=\> vai trò cung cấp sàn GDTMĐT để ở đó người bán – người mua gặp nhau thực hiện giao dịch và sàn TMĐT sẽ kết hợp các dịch vụ khác để giao hàng cho khách hàng \=\> Vậy thì về mặt kỹ thuật thì Sàn TMĐT liên quan và vận hành như thế nào với App của nghiên cứu.  
- Doanh nghiêp vận tải thông thường, DN CPN, DN logistics cung cấp các dịch vụ giao nhận hàng hóa cho người tiêu dùng cuối cùng/DN

## **3.2. CARRIER \=\> Lưu trữ thông tin của 1 đv vận tải nào đó, cần định nghĩa Carrier, và yêu cầu dữ liệu cần lấy \=\> có thể bổ sung**	  {#3.2.-carrier-=>-lưu-trữ-thông-tin-của-1-đv-vận-tải-nào-đó,-cần-định-nghĩa-carrier,-và-yêu-cầu-dữ-liệu-cần-lấy-=>-có-thể-bổ-sung}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính của đơn vị vận tải |
| organization\_id | UUID | FK → ORGANIZATION.id |
| name | string | Tên hãng vận tải (VD: GHN, GHTK, Shopee Express) |
| scale |  | Số lượng xe tham gia vận chuyển Số kho bãi/số diện tích kho bãi Số lô hàng được vận chuyển |
|  |  |  |

## **3.3. VEHICLE Lưu trữ thông tin của pt vận tải nào đó, cần định nghĩa pt, và yêu cầu dữ liệu cần lấy \=\> có thể bổ sung**	 {#3.3.-vehicle-lưu-trữ-thông-tin-của-pt-vận-tải-nào-đó,-cần-định-nghĩa-pt,-và-yêu-cầu-dữ-liệu-cần-lấy-=>-có-thể-bổ-sung}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính phương tiện |
| carrier\_id | UUID | FK → CARRIER.id |
| type | string | Loại xe (bike, van, truck, e-scooter, …) |
| plate | string | Biển số xe |
|  |  |  |
| is\_electric | boolean | TRUE nếu xe điện |
| TCPT | Công thức tính | Tiêu chuẩn phát thải EURO 5,  |
| TCPT |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

## **3.4.FACILITY** {#3.4.facility}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính cơ sở |
| organization\_id | UUID | FK → ORGANIZATION.id |
| name | string | Tên điểm trung chuyển / kho / trạm |
| zone\_id | UUID | FK → ZONE.id |
| lat | float | Vĩ độ |
| lon | float | Kinh độ |
|  |  |  |

## **3.5. CHARGER** {#3.5.-charger}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính trạm sạc |
| facility\_id | UUID | FK → FACILITY.id |
| type | string | Loại trạm (AC/DC/fast/slow) |
| power\_kw | float | Công suất đầu ra (kW) |
|  |  |  |

## **3.6. FUEL\_PUMP** {#3.6.-fuel_pump}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính trạm xăng |
| facility\_id | UUID | FK → FACILITY.id |
| fuel\_type | string | Loại nhiên liệu (RON95, Diesel, E5, …) |
|  |  |  |

## **3.7.DOCK** {#3.7.dock}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính khu bến / dock |
| facility\_id | UUID | FK → FACILITY.id |
| capacity | int | Số lượng phương tiện tối đa phục vụ cùng lúc |
|  |  |  |
|  |  |  |

## **3.8. ZONE** {#3.8.-zone}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính vùng / khu vực |
| name | string | Tên vùng (VD: Ba Đình, Đống Đa, Láng, …) |
| boundary | geometry | Đa giác giới hạn hành chính / khu vực |
|  |  |  |

## **3.9.ROAD\_SEGMENT** {#3.9.road_segment}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính đoạn đường |
| name | string | Tên đường |
| geom | geometry | Hình học tuyến đường (LINESTRING) |
|  |  |  |

## **3.10.RESTRICTION \=\> Phụ thuộc vào tuyến đường** {#3.10.restriction-=>-phụ-thuộc-vào-tuyến-đường}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính quy định hạn chế |
| road\_segment\_id | UUID | FK → ROAD\_SEGMENT.id |
| vehicle\_type | string | Loại xe bị ảnh hưởng |
| time\_from | time | Thời điểm bắt đầu hạn chế |
| time\_to | time | Thời điểm kết thúc hạn chế |
| allowed | boolean | TRUE nếu được phép lưu thông |
|  |  |  |

## **3.11.ORDER \=\> bổ sung yêu cầu**  {#3.11.order-=>-bổ-sung-yêu-cầu}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính đơn hàng |
| customer\_id | UUID | ID khách hàng (có thể ẩn danh hoặc từ user) |
| status | string | Trạng thái đơn (pending / shipped / completed) |
|  |  |  |
|  |  |  |

## **3.12. SHIPMENT \=\> Đóng theo lô hàng \=\> ghom hàng** {#3.12.-shipment-=>-đóng-theo-lô-hàng-=>-ghom-hàng}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính lô hàng |
| order\_id | UUID | FK → ORDER.id |
| weight | float | Khối lượng (kg) |
| volume | float | Thể tích (m³) |
|  |  |  |

## **3.13. LEG \=\> Chặng vận chuyển, tuyến đường của lô hàng (các node, điểm trung chuyển)** {#3.13.-leg-=>-chặng-vận-chuyển,-tuyến-đường-của-lô-hàng-(các-node,-điểm-trung-chuyển)}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính chặng vận chuyển |
| shipment\_id | UUID | FK → SHIPMENT.id |
| route\_id | UUID | FK → ROUTE.id |
| sequence | int | Thứ tự chặng trong lô hàng |

## **3.14.STOP** {#3.14.stop}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính điểm dừng |
| leg\_id | UUID | FK → LEG.id |
| facility\_id | UUID | FK → FACILITY.id |
| type | string | Loại điểm (pickup / delivery / transit) |
| arrival | datetime | Thời gian đến |
| departure | datetime | Thời gian rời đi |
|  |  |  |

## **3.15. ROUTE** {#3.15.-route}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính tuyến |
| name | string | Tên tuyến |
| mode | string | Loại hình vận tải (road / rail / bike / van, …) |
|  |  |  |

## **3.16. TELEMETRY** {#3.16.-telemetry}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính dữ liệu cảm biến |
| vehicle\_id | UUID | FK → VEHICLE.id |
| timestamp | datetime | Thời điểm ghi nhận |
| lat | float | Vĩ độ |
| lon | float | Kinh độ |
| speed | float | Tốc độ (km/h) |
| battery | float | Mức pin (nếu xe điện) |

## **3.17. ASSIGNMENT** {#3.17.-assignment}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính phân công |
| vehicle\_id | UUID | FK → VEHICLE.id |
| leg\_id | UUID | FK → LEG.id |
| assigned\_at | datetime | Thời điểm phân công |

## **3.18. USER \=\> cần bổ sung** {#3.18.-user-=>-cần-bổ-sung}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính người dùng |
| name | string | Họ và tên |
| email | string | Địa chỉ email đăng nhập |
|  |  |  |

## **3.19. MEMBERSHIP \=\> quyến ưu tiên theo membership** {#3.19.-membership-=>-quyến-ưu-tiên-theo-membership}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính thành viên |
| user\_id | UUID | FK → USER.id |
| organization\_id | UUID | FK → ORGANIZATION.id |
| role\_id | UUID | FK → ROLE.id |
|  |  |  |

## **3.20. ROLE** {#3.20.-role}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính vai trò |
| name | string | Tên vai trò (admin, viewer, researcher, …) |
|  |  |  |

## **3.21. PERMISSION** {#3.21.-permission}

| Tên trường | Kiểu dữ liệu | Ghi chú |
| ----- | ----- | ----- |
| id | UUID | Khóa chính quyền hạn |
| name | string | Tên quyền (manage\_vehicle, view\_data, …) |
| action | string | Loại hành động (read, write, delete, …) |

# **4\. Bảo mật và tuân thủ** {#4.-bảo-mật-và-tuân-thủ}

## **4.1. Kiến trúc bảo mật tổng quan** {#4.1.-kiến-trúc-bảo-mật-tổng-quan}

* Mỗi service độc lập chịu trách nhiệm bảo mật dữ liệu của chính nó.

* API Gateway là lớp “trust boundary” chính giữa Internet và mạng nội bộ.

* Giao tiếp nội bộ giữa các container qua mạng riêng (overlay), bắt buộc mã hóa TLS nội bộ (mTLS nếu có thể).

* Dùng token-based identity propagation (JWT hoặc opaque token) giữa các service.

## **4.2. Tuân thủ OWASP Top 10 theo từng tầng** {#4.2.-tuân-thủ-owasp-top-10-theo-từng-tầng}

### **4.2.1.  Broken Access Control / IDOR** {#4.2.1.-broken-access-control-/-idor}

* Thực hiện kiểm tra tenant\_id, user\_id, organization\_id ở mọi truy vấn.

* Áp dụng Row-Level Security (RLS) tại PostgreSQL để ngăn truy cập dữ liệu tổ chức khác.

* Với mỗi service, có middleware Authorization Guard xác thực quyền dựa trên vai trò (role\_id, permissions\[\]).

* Ở gateway, chặn request không có JWT hợp lệ hoặc bị thu hồi.

### **4.2.2. Cryptographic Failures** {#4.2.2.-cryptographic-failures}

* HTTPS bắt buộc với tất cả public endpoint (Nginx ép TLS 1.3 \+ HSTS).

* Dữ liệu lưu trữ (PostgreSQL, MinIO) bật AES-256 encryption at rest.

* JWT ký bằng RS256, lưu private key an toàn trong .env.secrets hoặc KMS.

* Token & refresh token có thời hạn ngắn, tự động rotate khi login.

### **4.2.3. Injection (SQL, NoSQL, Command)** {#4.2.3.-injection-(sql,-nosql,-command)}

* Mọi truy vấn qua ORM (TypeORM, Prisma) với parameter binding.

* Tuyệt đối không dùng string concatenation.

* Khi cần truy vấn phức tạp: queryBuilder → .setParameters({}) thay vì nội suy.

* Đặt strictQuery hoặc parameterizedStatements=true trong config DB.

### **4.2.4. Insecure Design / SSRF** {#4.2.4.-insecure-design-/-ssrf}

* Không cho phép service gọi HTTP outbound trừ danh sách “trusted domains”.

* Outbound của ETL Worker qua proxy nội bộ có allowlist.

* Cấu hình Nginx hoặc WAF chặn truy cập 169.254.\*, localhost, hoặc metadata API (ngăn SSRF).

* Sử dụng pattern “Defense-in-depth”: chặn tại WAF, validate tại code, giám sát tại logs.

## ---

### **4.2.5. Security Misconfiguration** {#4.2.5.-security-misconfiguration}

* Mỗi container/service có profile riêng, không dùng shared root image.

* Disable directory listing, disable default creds.

* Config “Deny All” mặc định → chỉ allow inbound ports: 22, 80, 443\.

* Outbound cho phép tất cả trừ SMTP (25/tcp).

* Hạn chế volume mount “read-only” trừ khi cần ghi log.

### **4.2.6. Vulnerable & Outdated Components** {#4.2.6.-vulnerable-&-outdated-components}

* CI/CD pipeline chạy:

  * npm audit \--production

  * trivy fs . cho image

  * semgrep \--config owasp-top-ten

* Theo dõi dependency với RenovateBot / Dependabot.

* Bật auto-rebuild container khi phát hiện CVE mới.

### **4.2.7. Identification & Authentication Failures** {#4.2.7.-identification-&-authentication-failures}

* Auth Service xử lý login, token issuance.

* API Gateway xác minh JWT qua public key (JWKS).

* Refresh token lưu trong DB (revocable).

* Mỗi service nội bộ có service-to-service JWT (khác keypair, scope \= internal).

* Ghi log toàn bộ event login/logout vào bảng audit\_log.

### **4.2.8.  Software & Data Integrity Failures** {#4.2.8.-software-&-data-integrity-failures}

* Mỗi Docker image ký bằng cosign (Sigstore).

* Tất cả file upload (GeoJSON, CSV) được hash SHA256 trước lưu.

* Bật “content validation” – chỉ cho phép MIME hợp lệ (image/png, application/json).

* Pipeline CI/CD có signature check trước deploy.

### **4.2.9. Security Logging & Monitoring Failures** {#4.2.9.-security-logging-&-monitoring-failures}

* Ghi log bảo mật tập trung (OpenTelemetry → Loki/ELK).

* Không ghi PII thô: chỉ log user\_id, hash(device\_id).

* Giám sát qua Prometheus (metrics HTTP 4xx/5xx, login attempts).

* Cảnh báo bất thường gửi về Slack/Email (alertmanager).

### **4.2.10. Server-Side Request Forgery (SSRF)** {#4.2.10.-server-side-request-forgery-(ssrf)}

* Chặn outbound từ các service (trừ ETL Worker có rule riêng).  
* Tại code: validate URL input bằng regex domain whitelist.

## **4.3. Bảo mật tầng Edge & Gateway** {#4.3.-bảo-mật-tầng-edge-&-gateway}

| Lớp | Thành phần | Cấu hình bảo vệ |
| ----- | ----- | ----- |
| Edge (CDN/WAF) | Cloudflare / Nginx Proxy Manager | \- Rate limiting \- OWASP CRS rule \- DDoS shield |
| Firewall Policy | OS-level (UFW/iptables) | \- Deny all by default \- Inbound: 22, 80, 443 \- Outbound: deny 25/tcp |
| API Gateway (Nginx) | Reverse proxy / TLS termination | \- Force HTTPS \- HSTS 365 days \- CSP, X-Frame-Options, X-Content-Type-Options |
| Headers bảo mật | Static rules | Example: Content-Security-Policy: default-src 'self' |

## 

## **4.4. Privacy & Tuân thủ pháp lý** {#4.4.-privacy-&-tuân-thủ-pháp-lý}

| Hạng mục | Chính sách / Cơ chế | Ghi chú |
| ----- | ----- | ----- |
| Privacy Notice | Hiển thị khi người dùng đăng ký/lần đầu truy cập | Nêu rõ mục đích, thời gian lưu trữ |
| Cookie Banner | Bắt buộc consent trước khi đặt cookie không thiết yếu | Cho phép bật/tắt từng nhóm cookie |
| DPIA (Data Protection Impact Assessment) | Thực hiện khi có PII/PHI (dữ liệu người, bệnh nhân, toạ độ cụ thể) | Áp dụng theo NĐ 13/2023 & GDPR |
| Anonymization | Ẩn danh dữ liệu định vị, user PII trong log | Geo-fuzzing ±50m |
| Logging & Observability | Audit log không ghi raw PII | Chỉ lưu mã định danh (ID, hash) |
| Data Retention | Tự động xoá sau X ngày / theo mục đích nghiên cứu | Quy định trong Privacy Notice |

## 

## **4.5. Kiểm thử & Giám sát bảo mật** {#4.5.-kiểm-thử-&-giám-sát-bảo-mật}

| Loại kiểm thử | Công cụ / Tần suất | Mục tiêu |
| ----- | ----- | ----- |
| SAST (Static Analysis) | Semgrep, CodeQL (CI/CD) | Phát hiện lỗi trong code |
| DAST (Dynamic Analysis) | OWASP ZAP, Burp Suite (staging) | Thử khai thác lỗ hổng runtime |
| Dependency Scan | Trivy, npm audit | Phát hiện CVE trong thư viện |
| Container Scan | Trivy / Grype | Kiểm tra image base |
| Pentest nội bộ | Mỗi quý | Đánh giá khả năng chịu tấn công |
| Monitoring & Alerting | Prometheus \+ ELK \+ OpenTelemetry | Giám sát logs, metrics, traces |

## 

## **4.6. Chính sách DevSecOps** {#4.6.-chính-sách-devsecops}

* Mỗi Pull Request chạy **security pipeline**: SAST \+ dependency scan.

* Tự động gắn nhãn CVE cho dependency lỗi.

* Mọi deploy staging/production yêu cầu **review an ninh** từ DevSecOps.

* Các secret được quản lý qua .env mã hóa hoặc Vault (HashiCorp / Doppler).

* Bật MFA cho tài khoản CI/CD, Git, Cloud.

## **4.7. Luồng bảo mật microservice** {#4.7.-luồng-bảo-mật-microservice}

![][image2]

# **5\. Hạ tầng & Triển khai** {#5.-hạ-tầng-&-triển-khai}

## **5.1. Hạ tầng** {#5.1.-hạ-tầng}

## **5.1.1. Kiến trúc mạng** {#5.1.1.-kiến-trúc-mạng}

| Thành phần | Vị trí | Ghi chú |
| ----- | ----- | ----- |
| NIC Public (eth0) | Truy cập Internet | Chỉ mở cổng 80/443 để reverse proxy |
| Private Loopback (127.0.0.1) | App ↔ Database | Không public, chỉ cho phép nội bộ |
| Tường lửa (Firewall) | UFW / iptables | Chính sách *deny all* mặc định |
| Mở cổng | 22/tcp (SSH), 80/tcp, 443/tcp | Không mở các cổng DB (3306, 5432\) ra ngoài |
| Quản trị từ xa | SSH key, non-root sudo | Tắt password login, PermitRootLogin=no |

## **5.1.2. Triển khai VPS** {#5.1.2.-triển-khai-vps}

| Mục | Mô tả |
| ----- | ----- |
| Kiểu triển khai | 01 VPS (Viettel IDC / Cloud) |
| OS | Ubuntu 22.04 LTS |
| CPU / RAM / Storage | 4 vCPU, 8GB RAM, 100GB SSD |
| Runtime | Docker Engine \+ Docker Compose |
| Proxy / SSL | Nginx (reverse proxy, HSTS, HTTPS enforcement) |
| Cơ sở dữ liệu | PostgreSQL \+ PostGIS |
| **Lưu trữ tệp** | MinIO Object Storage |
| Giám sát | Prometheus \+ Grafana \+ Loki |

## **5.1.3. Bảo mật** {#5.1.3.-bảo-mật}

| Biện pháp | Mô tả |
| ----- | ----- |
| SSH Key-based Authentication | Tắt đăng nhập bằng mật khẩu, chỉ dùng SSH key (chmod 600, sudo useradd deploy) |
| Quản lý khóa API & secrets | Lưu ngoài repo (/etc/secrets.env), hạn chế quyền truy cập (chmod 600\) |
| Giới hạn API Key theo IP | Cấu hình whitelist tại reverse proxy (Nginx / WAF) |
| Nhật ký Audit | Ghi lại toàn bộ hành động admin, truy cập hệ thống và thay đổi cấu hình |
| UFW Firewall Rules | \- Deny all inbound- Allow 22/tcp, 80/tcp, 443/tcp- Deny 25/tcp outbound |
| User non-root / sudo limited | Quản trị qua deploy user, hạn chế quyền root |

## **5.1.4. Backup** {#5.1.4.-backup}

| Hạng mục | Cơ chế | Ghi chú |
| ----- | ----- | ----- |
| Database | Logical dump (pg\_dump) hàng ngày vào /backups | Lưu 7 bản gần nhất |
| Offsite Backup | Dùng Restic upload sang MinIO/Azure Blob | Mã hóa AES-256 |
| Kiểm thử phục hồi | Restore ngẫu nhiên bản backup để kiểm chứng integrity | Thực hiện hàng tháng |
| Versioning log | Giữ lại bản dump theo tag ngày (ISO 8601\) | Ví dụ: backup-2025-10-07.sql.gz |

## **5.2. Triển khai** {#5.2.-triển-khai}

## **5.2.1. Chuẩn bị môi trường** {#5.2.1.-chuẩn-bị-môi-trường}

| Bước | Nội dung |
| ----- | ----- |
| 1 | Tạo user sudo không root (deploy) |
| 2 | Cấu hình SSH key và disable password login |
| 3 | Cài Docker Engine \+ Compose (apt install docker.io docker-compose) |
| 4 | Kích hoạt UFW và rule cơ bản (22, 80, 443\) |
| 5 | Thiết lập tên miền và chứng chỉ TLS (Let’s Encrypt / Certbot) |

## **5.2.2. Cấu hình ban đầu** {#5.2.2.-cấu-hình-ban-đầu}

**Reverse Proxy (Nginx):**

* Chuyển hướng HTTP → HTTPS

* Bật HSTS (Strict-Transport-Security: 31536000\)

* Thêm header bảo mật:

  X-Frame-Options: DENY

  X-Content-Type-Options: nosniff

  Content-Security-Policy: default-src 'self'

**Cơ sở dữ liệu:**

* Khởi tạo PostgreSQL hoặc MySQL.

* Tạo role ứng dụng app\_user với quyền tối thiểu.

* Tắt truy cập ngoài listen\_addresses \= 'localhost'.

**Secrets & ENV:**

* Lưu file .env trong /etc/app/env (ngoài repo).

* Quyền truy cập: chmod 600, chỉ user deploy đọc.

## **5.2.3. Build & Phát hành** {#5.2.3.-build-&-phát-hành}

| Giai đoạn | Nội dung |
| ----- | ----- |
| **Build** | docker compose build – quét lỗ hổng bằng trivy fs . |
| Tag & Versioning | Gắn tag theo commit và ngày build (v1.0.0+20251007) |
| Migration Database | npm run migration:run (hoặc TypeORM CLI) |
| Triển khai Stack | docker compose up \-d gồm: api, auth, gis, ops, worker, db, minio |
| Healthcheck | /api/v1/health, /actuator/ready |
| Baseline Performance | ApacheBench / K6 test \~100 req/s baseline |

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>
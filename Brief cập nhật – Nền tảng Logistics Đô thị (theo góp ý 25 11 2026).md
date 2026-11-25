# Brief cập nhật – Nền tảng Logistics Đô thị (theo góp ý 25/11/2026)

Nov 25, 2026 · @Khiemm

## 1. Bối cảnh và mục tiêu

Góp ý mới chuyển trọng tâm sản phẩm từ "bản đồ + dữ liệu tĩnh" sang **giả lập vận hành**: tạo đơn hàng ảo, cho đơn chạy qua mạng lưới hub 2 cấp của từng doanh nghiệp ở Hà Nội, rồi chia sẻ kết quả giữa doanh nghiệp và cơ quan quản lý. Bản brief này bổ sung FR21–FR29 vào Tài liệu thiết kế v2.0 (FR1–FR20 giữ nguyên).

Ba mục tiêu của bản cập nhật:

1. **Giả lập luồng hàng có lộ trình:** 1.000 đơn ảo mỗi ngày (8h–17h) của 3 doanh nghiệp giả lập, đi theo chuỗi MiniHub nhận → Hub tổng của doanh nghiệp → MiniHub giao, có khối lượng, thể tích, xe và tuyến đường cụ thể.
2. **Chia sẻ dữ liệu giữa doanh nghiệp:** mỗi doanh nghiệp có hub riêng, công khai năng lực kho còn trống (m³, kg) và lịch sử giao hàng cho các bên được phép xem.
3. **Phục vụ điều hành đô thị:** Trung tâm điều hành xem lưu lượng xe, thử kịch bản khu phát thải thấp (LEZ) năm 2027 với các trạm trung chuyển; người dùng tra cứu và phản ánh phương án.

Phạm vi địa lý: Hub tổng ở cửa ngõ Mê Linh và Gia Lâm, MiniHub ở các phường nội đô Hà Nội.

## 2. Đối chiếu góp ý → tính năng

Mỗi góp ý được gán vào một mã FR mới hoặc mở rộng FR cũ. Cột "Ưu tiên" giải thích ở mục 6.

| Góp ý | Tính năng | Mã | Ưu tiên |
| --- | --- | --- | --- |
| Lộ trình Hub 1 → Hub tổng → MiniHubs, phạm vi Hà Nội | Mạng lưới hub 2 cấp theo doanh nghiệp (MiniHub ↔ Hub tổng) | FR21 | P1 |
| Doanh nghiệp có hub riêng, chia sẻ thông tin kho: còn chứa được bao nhiêu hàng, mét khối, khối lượng | Hub doanh nghiệp và bảng năng lực kho dùng chung | FR22 | P1 |
| Giả lập tập 1.000 đơn, phường cao tỷ trọng 2,5/10 | Bộ sinh đơn hàng ảo có trọng số theo phường | FR23 | P1 |
| Tạo đơn hàng ảo kèm lộ trình, chia đơn cho doanh nghiệp | Phân bổ đơn cho doanh nghiệp và lập lộ trình 3 chặng | FR24 | P1 |
| Tích hợp tìm đường | Tìm đường bằng OSRM tự dựng, né đường cấm theo loại xe và giờ | FR24 (con) | P1 |
| Chia sẻ khối lượng | Khối lượng (kg) và thể tích (m³) trên đơn, xe, kho | FR22, FR23 | P1 |
| Thêm dữ liệu về xe | Mở rộng hồ sơ xe: tải trọng, thể tích thùng, nhiên liệu, phát thải | FR3 (mở rộng) | P1 |
| Lịch sử giao hàng phải được chia sẻ | Nhật ký giao hàng dùng chung có phân quyền | FR25 | P2 |
| Ba loại dữ liệu: giả lập, opensource, khảo sát | Gắn nhãn nguồn cho mọi bản ghi, lọc theo nguồn | FR29 | P2 |
| Người dùng: tra cứu, phản ánh phương án, kết quả chạy thử | Cổng người dùng công khai | FR28 | P2 |
| Trung tâm điều hành đô thị: lưu lượng xe, phân tán tín hiệu giao thông | Màn hình lưu lượng xe theo đoạn đường cho cơ quan quản lý | FR26 | P3 |
| Khu phát thải thấp năm 2027 để làm trạm trung chuyển | Kịch bản LEZ 2027 và bố trí trạm trung chuyển | FR27 | P3 |

Dữ liệu xe được xử lý bằng cách mở rộng FR3 có sẵn, không tạo mã mới.

## 3. Mô tả các tính năng mới

### FR21 – Mạng lưới hub 2 cấp theo doanh nghiệp

- **MiniHub:** điểm cấp phường, vừa **nhận hàng** gửi đi vừa **giao hàng** chặng cuối. "Hub 1" trong góp ý chính là MiniHub ở vai nhận hàng. MiniHub đặt dày ở 3 phường đông đơn Ba Đình, Cầu Giấy, Đống Đa; mặc định mỗi doanh nghiệp 8 MiniHub, 6 cái ở 3 phường này (2 cái mỗi phường) và 2 cái ở phường khác.
- **Hub tổng:** mỗi doanh nghiệp có Hub tổng riêng, đặt ở cửa ngõ Mê Linh hoặc Gia Lâm. Hàng từ MiniHub nhận gom về đây, rồi chia đi MiniHub giao.
- Mỗi hub có: cấp, doanh nghiệp sở hữu, tọa độ, phường, giờ hoạt động, sức chứa. Sức chứa giả lập: Hub tổng 1.000 tấn, MiniHub 1–2 tấn.
- Bản đồ hiển thị 2 lớp hub, lọc theo doanh nghiệp, có đường nối MiniHub – Hub tổng.

đặt tại Mê Linh, Gia Lâm (mô phỏng dữ liệu cho 3 doanh nghiệp thì chọn đại chỉ kho tổ 3 doanh nghiệp ở 2 địa chỉ đó cho tôi nhé)&#32;

**Hub tổng của 3 doanh nghiệp giả lập**

| Doanh nghiệp | Hub tổng | Vị trí đặt kho |
| --- | --- | --- |
| DN A | Hub tổng Mê Linh | Khu công nghiệp Quang Minh, cạnh cao tốc Thăng Long – Nội Bài (xã Quang Minh, Mê Linh cũ) |
| DN B | Hub tổng Gia Lâm 1 | Khu công nghiệp Hapro, Lệ Chi, cạnh Quốc lộ 5 (Gia Lâm cũ) |
| DN C | Hub tổng Gia Lâm 2 | Khu vực ICD Cổ Bi (Gia Lâm cũ) |

Ba doanh nghiệp và kho là giả lập, chỉ mượn vị trí các khu kho có thật ở Mê Linh và Gia Lâm ([KCN Quang Minh](https://batdongsan.com.vn/cho-thue-kho-nha-xuong-dat-me-linh), [KCN Hapro](https://guland.vn/cho-thue-kho-nha-xuong-xa-thuan-an-ha-noi), [ICD Cổ Bi](https://sovhtt.hanoi.gov.vn/wp-content/uploads/2026/03/ke-hoach-so-104kh-ubnd-ngay-1332026-cua-ubnd-thanh-pho.pdf)). Tọa độ chính xác chấm trên bản đồ khi nhập dữ liệu, gắn nhãn "giả lập" (FR29).

### FR22 – Hub doanh nghiệp và năng lực kho dùng chung

- Doanh nghiệp tự khai và cập nhật hub của mình (nối với cổng tự khai FR20).
- Mỗi hub công bố **sức chứa tối đa, đang dùng, còn trống** theo m³ và kg, kèm thời điểm cập nhật.
- **Được chia sẻ:** sức chứa kho, thông tin hàng hóa (loại hàng, số kiện, kg, m³) và lịch sử vận chuyển từ hub nào qua hub nào.
- **Ẩn hoàn toàn:** mọi thông tin khách hàng (tên, số điện thoại, địa chỉ cụ thể của người gửi và người nhận). Điểm giao chỉ hiện đến cấp phường.
- Bảng tổng hợp: tìm hub còn trống gần một điểm, lọc theo m³/kg cần gửi.

### FR23 – Sinh tập đơn hàng ảo

- Mỗi kịch bản giả lập = **1.000 đơn cho 1 ngày**, thời điểm tạo đơn rải trong giờ hành chính 8h–17h.
- **25% số đơn** (250 đơn) giao vào nhóm phường mật độ cao: Ba Đình, Cầu Giấy, Đống Đa. 75% còn lại rải cho các phường nội đô khác. Tỷ lệ và danh sách phường chỉnh được trong bảng trọng số.
- Đơn được chia đều cho 3 doanh nghiệp (333 / 333 / 334 đơn); tỷ lệ vẫn chỉnh được.
- Mỗi đơn có: MiniHub nhận, phường giao, khối lượng (kg), thể tích (m³), loại hàng, số kiện, giờ tạo, doanh nghiệp. Không sinh thông tin khách hàng.
- Có seed cố định để chạy lại ra cùng một tập đơn khi so sánh phương án.

### FR24 – Phân bổ đơn và lộ trình 3 chặng

- Mỗi đơn sinh 3 chặng: **MiniHub nhận → Hub tổng của doanh nghiệp → MiniHub giao → người nhận**. Chặng nào cũng có xe, quãng đường, thời gian, CO₂.
- **Tìm đường:** tự dựng OSRM trên dữ liệu OSM Hà Nội (Docker), mỗi loại xe một profile riêng để né đoạn cấm theo loại xe và giờ (bảng quy định FR8). Mapbox chỉ dùng làm bản đồ nền.
- Kiểm tra tải: tổng kg/m³ trên mỗi xe và mỗi hub không vượt sức chứa.
- Xem lộ trình của một đơn trên bản đồ và phát lại theo giờ trong ngày.

### FR3 mở rộng – Dữ liệu xe

- Thêm trường: tải trọng (kg), thể tích thùng (m³), kích thước, nhiên liệu (xăng/dầu/điện), tiêu chuẩn khí thải, hệ số phát thải, được vào LEZ hay không.
- Có bộ xe mẫu theo loại (xe máy, xe ba gác điện, van, tải nhẹ) để giả lập khi doanh nghiệp chưa khai.

### FR25 – Lịch sử giao hàng dùng chung

- Ghi sự kiện theo từng chặng: nhận tại MiniHub, nhập/xuất Hub tổng, nhập MiniHub giao, giao thành công hoặc thất bại (lý do).
- **Nội dung chia sẻ:** thông tin sản phẩm (loại hàng, số kiện, kg, m³) và hành trình từ hub nào qua hub nào, kèm thời điểm.
- **Không lưu, không chia sẻ** thông tin khách hàng; điểm giao chỉ đến cấp phường.
- Cơ quan quản lý, nhóm nghiên cứu và các doanh nghiệp tham gia đều xem được; có báo cáo tổng hợp theo phường × giờ.

### FR26 – Trung tâm điều hành đô thị

- Màn hình cho cơ quan quản lý: **mỗi tuyến, mỗi đoạn đường có thông tin lưu lượng xe**. Đây là cách hiểu "phân tán tín hiệu giao thông" đã chốt; không mô phỏng pha đèn.
- Mỗi đoạn đường hiển thị: số xe giao hàng đi qua theo giờ (đếm từ tuyến OSRM của kịch bản giả lập) và tốc độ thực tế từ TomTom.
- Tô màu đoạn đường theo mức lưu lượng; kéo thanh giờ 8h–17h để xem thay đổi trong ngày.
- Cảnh báo khi một đoạn đường vượt ngưỡng xe/giờ.

### FR27 – Kịch bản LEZ 2027 và trạm trung chuyển

Đề xuất vùng thử bám theo đề án thật của Hà Nội. HĐND thành phố đã thông qua Đề án "Vùng phát thải thấp trong Vành đai 1" ngày 15/6/2026 ([Nhân Dân](https://nhandan.vn/ha-noi-trien-khai-de-an-vung-phat-thai-thap-trong-vanh-dai-1-tu-ngay-17-post969203.html)). Năm 2027 vùng thí điểm là Khu vực 1, 2, 3 thuộc phường Hoàn Kiếm và Cửa Nam; 2028–2029 mở rộng ra toàn Vành đai 1. Ranh giới các khu vực nằm trong bản đồ kèm Quyết định 3273/QĐ-UBND ([Đại biểu Nhân dân](https://daibieunhandan.vn/de-an-vung-phat-thai-thap-trong-vanh-dai-1-thanh-pho-ha-noi-ho-tro-truoc-han-che-theo-lo-trinh-cong-khai-minh-bach-vi-ha-noi-xanh-sach-dep-10422328.html)).

| Kịch bản | Vùng LEZ | Trạm trung chuyển đề xuất |
| --- | --- | --- |
| A – LEZ 2027 | Khu vực 1, 2, 3 phường Hoàn Kiếm và Cửa Nam, vẽ theo bản đồ QĐ 3273 | 4 trạm sát rìa vùng, mỗi hướng Bắc – Đông – Nam – Tây một trạm |
| B – đi trước lộ trình 2028 | Toàn bộ Vành đai 1 | 6–8 trạm trên các trục cửa vào Vành đai 1 |

Demo chạy **cả 2 kịch bản** và so với trường hợp không có LEZ. Ranh 2 vùng và 11 trạm trung chuyển (4 cho A, 7 cho B) đã vẽ gần đúng trong file `lez_demo.geojson`, nhãn `SIMULATED`, nạp thẳng vào bảng `restriction` và `facility`. Ranh này chỉ để demo, sẽ vẽ lại theo bản đồ kèm QĐ 3273.

- Kịch bản B quan trọng hơn với bài toán giao hàng: phường Ba Đình (nhóm nhu cầu cao) nằm trong vùng thí điểm Vành đai 1 ([VietNamNet](https://vietnamnet.vn/tu-1-7-2026-ha-noi-cam-xe-may-xang-tai-mot-so-khu-vuc-vanh-dai-1-theo-khung-gio-2466925.html)), còn kịch bản A gần như không chạm tới 3 phường cao.
- Tại trạm, xe xăng/dầu dừng lại, hàng chuyển sang xe điện để vào trong vùng. Trạm có thể là MiniHub có sẵn nằm sát rìa, không cần hub mới.
- Hệ thống gợi ý vị trí trạm từ số đơn giao vào vùng và các cửa vào; người dùng kéo-thả để chỉnh.
- So sánh A/B và không-LEZ bằng module mô phỏng FR18: km, thời gian, CO₂, số xe xăng vào vùng, số đơn phải trung chuyển.

### FR28 – Cổng người dùng

- **Tra cứu:** hub, MiniHub, trạm trung chuyển, vùng cấm, LEZ gần một địa chỉ.
- **Kết quả chạy thử:** xem các kịch bản đã công bố, chỉ số và bản đồ trước/sau.
- **Phản ánh phương án:** góp ý trên từng kịch bản hoặc vị trí trạm (đồng ý/không, lý do, ghim trên bản đồ). Cơ quan quản lý xem và trả lời.

### FR29 – Nhãn nguồn dữ liệu

- Mọi bản ghi chính (hub, xe, đơn, quy định, giao thông) mang nhãn **giả lập / mở / khảo sát**, kèm tên nguồn và ngày.
- Lọc và tô màu theo nhãn trên bản đồ; báo cáo ghi rõ tỷ lệ dữ liệu từng loại.
- Dữ liệu khảo sát được ưu tiên khi có; thiếu thì lấy dữ liệu mở, cuối cùng mới giả lập.

## 4. Luồng dữ liệu và nguồn dữ liệu

Mọi dữ liệu đổ về một CSDL có nhãn nguồn; giả lập chỉ bù chỗ khảo sát và dữ liệu mở chưa có.

&#91;embedded content: luồng dữ liệu · 3 nguồn, 3 bước giả lập, 3 nhóm dùng\]

| Loại | Dùng cho | Ví dụ |
| --- | --- | --- |
| Khảo sát | Hub, sức chứa kho, đội xe, thói quen giao | Phiếu doanh nghiệp, shipper, cơ quan quản lý (FR11, FR20) |
| Dữ liệu mở | Nền bản đồ, đường, nút đèn, giao thông | OSM (đường, dữ liệu cho OSRM), TomTom Traffic Flow, ranh giới phường |
| Giả lập | Đơn hàng, xe mẫu, hub còn thiếu | 1.000 đơn theo trọng số phường, bộ xe mẫu theo loại |

## 5. Tác động tới CSDL và vai trò

Cần thêm 9 bảng và sửa 3 bảng cũ trong MySQL; 6 vai trò hiện có đủ dùng, chỉ thêm quyền.

**Bảng mới hoặc sửa**

| Bảng | Trường chính | FR |
| --- | --- | --- |
| `facility` (sửa) | thêm `hub_tier` (L1/CENTRAL/MINI/TRANSFER), `parent_hub_id`, `org_id`, `ward_id`, `capacity_m3`, `capacity_kg` | FR21, FR27 |
| `hub_capacity_snapshot` | `hub_id`, `used_m3`, `used_kg`, `share_level`, `recorded_at` | FR22 |
| `vehicle` (sửa) | thêm `payload_kg`, `cargo_m3`, `fuel_type`, `emission_std`, `co2_g_per_km`, `lez_allowed` | FR3 |
| `ward_weight` | `scenario_id`, `ward_id`, `weight`, `density_class` | FR23 |
| `sim_scenario` | `name`, `order_count`, `seed`, `lez_enabled`, `status`, `published_at` | FR23, FR27 |
| `sim_order` | `scenario_id`, `pickup_hub_id`, `dest_point`, `ward_id`, `weight_kg`, `volume_m3`, `time_window`, `org_id` | FR23, FR24 |
| `shipment_leg` | `order_id`, `leg_no`, `from_hub_id`, `to_hub_id`, `vehicle_id`, `route_geom`, `distance_km`, `duration_min`, `co2_g` | FR24 |
| `delivery_event` | `order_id`, `leg_id`, `event_type`, `hub_id`, `occurred_at`, `fail_reason`, `share_level` | FR25 |
| `segment_delivery_flow` | `scenario_id`, `segment_id`, `hour`, `vehicle_count` (đếm từ tuyến OSRM) | FR26 |
| `traffic_flow_snapshot` | `segment_id`, `speed_kmh`, `free_flow_kmh`, `captured_at` | FR26 |
| `scenario_feedback` | `scenario_id`, `user_id`, `stance`, `content`, `point`, `reply`, `status` | FR28 |
| `restriction` (sửa) | thêm `effective_year` để lưu vùng LEZ 2027 tách với quy định hiện hành | FR27 |

Mọi bảng dữ liệu chính thêm 3 cột `data_source` (SIMULATED/OPEN/SURVEY), `source_name`, `source_date` cho FR29.

**Quyền theo vai trò**

| Vai trò | Quyền thêm |
| --- | --- |
| Khách | Tra cứu hub, LEZ; xem kết quả đã công bố |
| Thành viên | Như Khách + gửi phản ánh phương án |
| Doanh nghiệp (quản trị/nhân viên) | Quản lý hub và sức chứa kho, chọn mức chia sẻ; xem lịch sử chi tiết của mình và tổng hợp của ngành |
| Cơ quan quản lý | Trung tâm điều hành, vẽ LEZ 2027, đặt trạm trung chuyển, công bố kịch bản, trả lời phản ánh |
| Nghiên cứu | Tạo và chạy kịch bản giả lập, xuất kết quả |
| Quản trị hệ thống | Cấu hình nguồn dữ liệu, API chỉ đường và TomTom |

## 6. Ưu tiên và câu hỏi cần chốt

Làm P1 trước vì đây là lõi demo "đơn chạy qua mạng lưới hub"; P3 phụ thuộc TomTom và bản đồ ranh LEZ theo QĐ 3273.

| Mức | Tính năng | Vì sao |
| --- | --- | --- |
| P1 | FR21, FR22, FR23, FR24, FR3 mở rộng; dựng OSRM | Lõi giả lập; các phần sau đều cần đơn, hub, xe và lộ trình |
| P2 | FR25, FR28, FR29 | Dùng kết quả P1 để chia sẻ và công bố; không cần dữ liệu mới |
| P3 | FR26, FR27 | Cần TomTom chạy ổn; ranh LEZ dùng bản demo trước, vẽ lại theo QĐ 3273 sau |

**Câu hỏi đã chốt (25/11/2026)** — nội dung trả lời đã đưa vào các mục FR ở trên.

- "Phường cao thì tỷ trọng 2,5/10" nghĩa là nhóm phường mật độ cao chiếm 25% tổng đơn, hay mỗi phường cao có trọng số 2,5 so với mức 1 của phường thường? Tiêu chí nào xếp phường vào nhóm "cao"? chiếm 25% tổng đơn ấy, phường nhóm cao là phường Ba Đình, phường Cầu Giấy, phường Đống Đa nhé.
- 1.000 đơn là cho một ngày hay một kịch bản bất kỳ? Có cần phân theo khung giờ không? 1.000 đơn 1 ngày. phân theo giờ hành chính 8h-17h
- "Phân tán tín hiệu giao thông" là hiển thị nút đèn và dàn luồng xe giao hàng, hay cần mô phỏng đổi pha đèn? Phương án sau nặng hơn nhiều và cần dữ liệu chu kỳ đèn.: Cái này thì mỗi tuyến đường đoạn đường thì có thông tin về lưu lượng xe là được nhé.&#32;
- Hub 1 là kho của doanh nghiệp vận chuyển, của người bán, hay hub cửa ngõ ngoại thành? Một doanh nghiệp có Hub tổng riêng hay dùng chung một Hub tổng thành phố? Hub 1 là hub nhận hàng nó chính là các minihubs ấy minihubs vừa là nhận hàng vừa là giao hàng nhé. 1 doanh nghiệp sẽ có hub tổng riêng nhé.&#32;
- Nguồn ranh giới LEZ 2027: có văn bản quy hoạch của Hà Nội, hay nhóm tự đề xuất vùng thử? Cái này thì đề xuất vùng thử cho tôi nhé
- Doanh nghiệp đã đồng ý chia sẻ sức chứa kho và lịch sử giao ở mức nào? Cần câu hỏi này trong phiếu khảo sát doanh nghiệp. Ẩn tất cả các thông tin về khách hàng chỉ cần thông tin về sản phẩm và lịch sử vận chuyển từ Hub nào qua Hub nào nhé
- Dùng Mapbox Directions (tính phí theo lượt) hay tự dựng OSRM trên dữ liệu OSM? 1.000 đơn × 3 chặng ≈ 3.000 lượt gọi mỗi lần chạy. dùng OSRM

**Đã chốt thêm (25/11/2026)**

- Tỷ lệ chia 1.000 đơn giữa DN A, B, C (chia đều hay theo thị phần giả định)? 1000 chia 3 doanhnghiepj nhé
- Mỗi doanh nghiệp có bao nhiêu MiniHub, đặt ở phường nào? đặt nhiều ở 3 quận đông ấy.&#32;
- Sức chứa giả lập của Hub tổng và MiniHub (m³, kg)? Hub tổng là chứa đc 1000 tấn hàng, Mini hub thì được 1-2 tấn hàng
- Chạy kịch bản LEZ A (Hoàn Kiếm + Cửa Nam) hay B (toàn Vành đai 1) làm mặc định cho demo? tôi nghĩ chạy cả 2
- Xin bản đồ kèm QĐ 3273/QĐ-UBND (file gốc) để vẽ ranh LEZ chính xác. czais này bạn vẽ đemo cho tôi trước rồi tôi sẽ tự vẽ lại sau

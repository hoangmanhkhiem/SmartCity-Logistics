-- Research / field collection tables (imported from repo root *.sql)

CREATE TABLE "0_Bang_Thu_Thap" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu/Thông tin cần thu thập" TEXT,
    "Nguồn dữ liệu" TEXT,
    "Biến nghiên cứu" TEXT,
    "Thời gian" TEXT,

    CONSTRAINT "0_Bang_Thu_Thap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "1_khu_thu_thap_cau_giay" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu / Nội dung cần thu thập
(bổ sung thêm chi" TEXT,
    "Nguồn dữ liệu dự kiến" TEXT,
    "Nguồn cụ thể (điền sau)" TEXT,
    "Cầu Giấy (Dịch Vọng)" TEXT,
    "Cầu Giấy ( Dịch Vọng Hậu)" TEXT,
    "Quan Hoa" TEXT,
    "Mỹ Đình 1" TEXT,
    "Mỹ Đình 2" TEXT,
    "Yên Hòa" TEXT,
    "Thời gian dữ liệu" TEXT,
    "Mục đích sử dụng" TEXT,
    "Ghi chú" TEXT,
    "column15" TEXT,

    CONSTRAINT "1_khu_thu_thap_cau_giay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "2_khu_thu_thap_dong_da" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu / Nội dung cần thu thập" TEXT,
    "Nguồn dữ liệu dự kiến" TEXT,
    "Nguồn cụ thể (điền sau)" TEXT,
    "Thịnh Quang" TEXT,
    "Quang Trung" TEXT,
    "Láng Hạ" TEXT,
    "Nam Đồng" TEXT,
    "Ô Chợ Dừa" TEXT,
    "Trung Liệt" TEXT,
    "Số liệu / Thông tin thu thập" TEXT,
    "Thời gian dữ liệu" TEXT,
    "Mục đích sử dụng" TEXT,
    "Ghi chú" TEXT,
    "column16" TEXT,

    CONSTRAINT "2_khu_thu_thap_dong_da_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "3_khu_thu_thap_hoan_kiem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu / Nội dung cần thu thập
(bổ sung thêm chi" TEXT,
    "Nguồn dữ liệu dự kiến" TEXT,
    "Nguồn cụ thể (điền sau)" TEXT,
    "Hàng Bạc" TEXT,
    "Hàng Bồ" TEXT,
    "Hàng Buồm" TEXT,
    "Hàng Đào" TEXT,
    "Hàng Gai" TEXT,
    "Hàng Mã" TEXT,
    "Lý Thái Tổ" TEXT,
    "Điện Biên" TEXT,
    "Đồng Xuân" TEXT,
    "1 phần Hàng Bông" TEXT,
    "1 phần Hàng Trống" TEXT,
    "1 phần Tràng Tiền" TEXT,
    "1 phần Cửa Nam, Cửa Đông" TEXT,
    "Thời gian dữ liệu" TEXT,
    "Mục đích sử dụng" TEXT,
    "Ghi chú" TEXT,
    "column22" TEXT,
    "column23" TEXT,
    "column24" TEXT,
    "column25" TEXT,
    "column26" TEXT,
    "column27" TEXT,
    "column28" TEXT,
    "column29" TEXT,
    "column30" TEXT,
    "column31" TEXT,
    "column32" TEXT,
    "column33" TEXT,
    "column34" TEXT,
    "column35" TEXT,
    "column36" TEXT,
    "column37" TEXT,
    "column38" TEXT,

    CONSTRAINT "3_khu_thu_thap_hoan_kiem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "4_khu_thu_thap_cua_nam" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu / Nội dung cần thu thập
(bổ sung thêm chi" TEXT,
    "Nguồn dữ liệu dự kiến" TEXT,
    "Nguồn cụ thể (điền sau)" TEXT,
    "Hàng Bài" TEXT,
    "Phan Chu Trinh" TEXT,
    "Trần Hưng Đạo" TEXT,
    "1 phần Nguyễn Du" TEXT,
    "1 phần Cửa Nam" TEXT,
    "1 phần Phạm Đình Hổ" TEXT,
    "phần còn lại Hàng Bông" TEXT,
    "phần còn lại Hàng Trống" TEXT,
    "phần còn lại Tràng Tiền" TEXT,
    "Thời gian dữ liệu" TEXT,
    "Mục đích sử dụng" TEXT,
    "Ghi chú" TEXT,
    "column18" TEXT,

    CONSTRAINT "4_khu_thu_thap_cua_nam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "5_khu_cong_nghiep_ba_dinh" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu / Nội dung cần thu thập
(bổ sung thêm chi" TEXT,
    "Nguồn dữ liệu dự kiến" TEXT,
    "Nguồn cụ thể (điền sau)" TEXT,
    "Quán Thánh" TEXT,
    "Trúc Bạch" TEXT,
    "1 phần (tự nhiên, quy mô dân số) Cửa Nam" TEXT,
    "Điện Biên" TEXT,
    "Đội Cấn" TEXT,
    "Kim Mã" TEXT,
    "Ngọc Hà" TEXT,
    "1 phần diện tích tự nhiênThụy Khuê" TEXT,
    "Phần còn lại của phường Cửa Đông" TEXT,
    "Phường Đồng Xuân" TEXT,
    "Thời gian dữ liệu" TEXT,
    "Mục đích sử dụng" TEXT,
    "Ghi chú" TEXT,
    "column19" TEXT,
    "column20" TEXT,
    "column21" TEXT,
    "column22" TEXT,
    "column23" TEXT,
    "column24" TEXT,
    "column25" TEXT,
    "column26" TEXT,
    "column27" TEXT,
    "column28" TEXT,
    "column29" TEXT,
    "column30" TEXT,
    "column31" TEXT,
    "column32" TEXT,
    "column33" TEXT,
    "column34" TEXT,
    "column35" TEXT,

    CONSTRAINT "5_khu_cong_nghiep_ba_dinh_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "6_khu_thu_thap_giang_vo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm dữ liệu" TEXT,
    "Chỉ tiêu / Nội dung cần thu thập
(bổ sung thêm chi" TEXT,
    "Nguồn dữ liệu dự kiến" TEXT,
    "Nguồn cụ thể (điền sau)" TEXT,
    "Giảng Võ" TEXT,
    "Cát Linh" TEXT,
    "Láng Hạ" TEXT,
    "Kim Mã" TEXT,
    "Ngọc Khánh" TEXT,
    "Thành Công" TEXT,
    "Cống Vị" TEXT,
    "Thời gian dữ liệu" TEXT,
    "Mục đích sử dụng" TEXT,
    "Ghi chú" TEXT,
    "column16" TEXT,
    "column17" TEXT,
    "column18" TEXT,
    "column19" TEXT,
    "column20" TEXT,
    "column21" TEXT,
    "column22" TEXT,
    "column23" TEXT,
    "column24" TEXT,
    "column25" TEXT,
    "column26" TEXT,
    "column27" TEXT,
    "column28" TEXT,
    "column29" TEXT,
    "column30" TEXT,
    "column31" TEXT,
    "column32" TEXT,

    CONSTRAINT "6_khu_thu_thap_giang_vo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "b" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm nội dung" TEXT,
    "Chỉ tiêu thu thập" TEXT,
    "Nội dung cụ thể ( Be )" TEXT,
    "Dạng dữ liệu" TEXT,
    "Đơn vị" TEXT,
    "Nguồn dữ liệu" TEXT,
    "Ghi chú" TEXT,

    CONSTRAINT "b_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grab" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm nội dung" TEXT,
    "Chỉ tiêu thu thập" TEXT,
    "Nội dung cụ thể ( Grab)" TEXT,
    "Dạng dữ liệu" TEXT,
    "Đơn vị" TEXT,
    "Nguồn dữ liệu" TEXT,
    "Ghi chú" TEXT,

    CONSTRAINT "grab_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shopee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stt" INTEGER,
    "Nhóm nội dung" TEXT,
    "Chỉ tiêu thu thập" TEXT,
    "Nội dung cụ thể ( Shopee)" TEXT,
    "Dạng dữ liệu" TEXT,
    "Đơn vị" TEXT,
    "Nguồn dữ liệu" TEXT,
    "Ghi chú" TEXT,

    CONSTRAINT "shopee_pkey" PRIMARY KEY ("id")
);

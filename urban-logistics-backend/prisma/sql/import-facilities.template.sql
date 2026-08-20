-- =============================================================================
-- Import nhanh kho / hub (bảng facilities — MySQL)
-- Chạy: mysql -u root -p logistic < prisma/sql/import-facilities.template.sql
-- =============================================================================
--
-- Bắt buộc có organization_id (FK tới organizations.id).
-- kind thường dùng: hub | warehouse | charging_station | fuel_station | mfc
--
-- Tọa độ: latitude (vĩ độ), longitude (kinh độ) — đúng thứ tự như trong app.
--
-- id là AUTO_INCREMENT — không truyền cột id, MySQL tự sinh.
--
-- =============================================================================
-- Bước 0: lấy organization_id và (tuỳ chọn) zone_id
-- =============================================================================
-- SELECT id, name FROM organizations WHERE isActive = true;
-- SELECT id, name FROM zones WHERE isActive = true;

-- =============================================================================
-- Mẫu: 1 hub + 1 kho (sửa organization_id / zone_id trước khi chạy)
-- =============================================================================

START TRANSACTION;

-- Thay 1 bằng id thật từ bảng organizations
-- Thay zone_id hoặc để NULL nếu chưa gán vùng

INSERT INTO facilities (
    organization_id,
    zone_id,
    name,
    kind,
    latitude,
    longitude,
    address,
    capacity,
    opening_time,
    closing_time,
    description,
    isActive,
    createdAt,
    updatedAt
)
VALUES
    (
        1, -- bắt buộc sửa: organization_id thật
        NULL,          -- hoặc id zone
        'Hub mẫu — Phạm Hùng',
        'hub',
        21.0285,      -- lat
        105.78,       -- lng
        'Số 18 Phạm Hùng, Cầu Giấy',
        500,
        '07:00',
        '22:00',
        'Tạo bằng SQL import',
        true,
        NOW(),
        NOW()
    ),
    (
        1,
        NULL,
        'Kho mẫu — Khuất Duy Tiến',
        'warehouse',
        20.9933,
        105.7980,
        'Số 5 Khuất Duy Tiến, Thanh Xuân',
        1000,
        '06:00',
        '23:00',
        NULL,
        true,
        NOW(),
        NOW()
    );

COMMIT;

-- =============================================================================
-- LOAD DATA (nhiều dòng)
-- File facilities.csv, header (không có cột id — AUTO_INCREMENT):
--   organization_id,zone_id,name,kind,latitude,longitude,address,capacity,opening_time,closing_time,description,isActive,createdAt,updatedAt
-- LOAD DATA LOCAL INFILE 'facilities.csv'
--   INTO TABLE facilities
--   FIELDS TERMINATED BY ',' ENCLOSED BY '"'
--   LINES TERMINATED BY '\n'
--   IGNORE 1 ROWS
--   (organization_id, zone_id, name, kind, latitude, longitude, address, capacity, opening_time, closing_time, description, isActive, createdAt, updatedAt);
-- =============================================================================

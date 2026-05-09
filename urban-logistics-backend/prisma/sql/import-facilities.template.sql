-- =============================================================================
-- Import nhanh kho / hub (bảng facilities — PostgreSQL)
-- Chạy: psql "$DATABASE_URL" -f prisma/sql/import-facilities.template.sql
-- =============================================================================
--
-- Bắt buộc có organization_id (FK tới organizations.id).
-- kind thường dùng: hub | warehouse | charging_station | fuel_station | mfc
--
-- Tọa độ: latitude (vĩ độ), longitude (kinh độ) — đúng thứ tự như trong app.
--
-- =============================================================================
-- Bước 0: lấy organization_id và (tuỳ chọn) zone_id
-- =============================================================================
-- SELECT id, name FROM organizations WHERE "isActive" = true;
-- SELECT id, name FROM zones WHERE "isActive" = true;

-- =============================================================================
-- Mẫu: 1 hub + 1 kho (sửa UUID organization / zone trước khi chạy)
-- =============================================================================

BEGIN;

-- Thay 'YOUR_ORG_ID' bằng UUID thật từ bảng organizations
-- Thay zone_id hoặc để NULL nếu chưa gán vùng

INSERT INTO facilities (
    id,
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
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        gen_random_uuid()::text,
        'YOUR_ORG_ID', -- bắt buộc sửa
        NULL,          -- hoặc UUID zone
        N'Hub mẫu — Phạm Hùng',
        'hub',
        21.0285,      -- lat
        105.78,       -- lng
        N'Số 18 Phạm Hùng, Cầu Giấy',
        500,
        '07:00',
        '22:00',
        N'Tạo bằng SQL import',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'YOUR_ORG_ID',
        NULL,
        N'Kho mẫu — Khuất Duy Tiến',
        'warehouse',
        20.9933,
        105.7980,
        N'Số 5 Khuất Duy Tiến, Thanh Xuân',
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
-- COPY CSV (nhiều dòng)
-- File facilities.csv, header:
--   id,organization_id,zone_id,name,kind,latitude,longitude,address,capacity,opening_time,closing_time,description,isActive,createdAt,updatedAt
-- \copy facilities FROM 'facilities.csv' WITH (FORMAT csv, HEADER true);
-- (Cột isActive: true/false hoặc t; thời gian dạng ISO nếu dùng TIMESTAMP.)
-- =============================================================================

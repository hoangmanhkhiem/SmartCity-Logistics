-- =============================================================================
-- Import nhanh dữ liệu cấm / hạn chế đường (PostgreSQL)
-- Bảng: road_segments (geometry GeoJSON) -> restrictions (khung giờ, loại xe, mức độ)
-- Chạy: psql "$DATABASE_URL" -f prisma/sql/import-traffic-restrictions.template.sql
-- Hoặc dán vào GUI (DBeaver / pgAdmin) sau khi sửa ID / geometry.
-- =============================================================================
--
-- Thứ tự quan hệ:
--   zones (tuỳ chọn)  -->  road_segments (geometry = GeoJSON LineString, text)
--                         -->  restrictions (road_segment_id trỏ tới segment)
--
-- Quy ước tọa độ trong "geometry": [lng, lat] (chuẩn GeoJSON), không đảo lat/lng.
--
-- days_of_week: Mon, Tue, Wed, Thu, Fri, Sat, Sun (theo mã trong code).
--                Mảng rỗng {} = mọi ngày (miễn khớp khung giờ).
--
-- vehicle_types: mảng TEXT, ví dụ ARRAY['truck'].
--                Rỗng {} = áp dụng mọi loại xe.
--
-- severity (màu bản đồ): prohibited | restricted | allowed_window
--
-- =============================================================================
-- Bước 0: (tuỳ chọn) lấy zone_id có sẵn để gắn vào đoạn đường
-- =============================================================================
-- SELECT id, name FROM zones WHERE "isActive" = true;

-- =============================================================================
-- Mẫu 1 hàng: INSERT một đoạn đường + một restriction (CTE một lần chạy)
-- =============================================================================

BEGIN;

WITH new_segment AS (
    INSERT INTO road_segments (
        id,
        zone_id,
        name,
        osm_id,
        geometry,
        one_way,
        speed_limit,
        lanes,
        road_type,
        "isActive",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        gen_random_uuid()::text,
        NULL, -- hoặc thay bằng UUID zone: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        N'Ví dụ — phố X (sửa tên)',
        NULL,
        '{"type":"LineString","coordinates":[[105.84,21.024],[105.842,21.026],[105.845,21.028]]}'::text,
        false,
        NULL,
        NULL,
        'primary',
        true,
        NOW(),
        NOW()
    )
    RETURNING id
)
INSERT INTO restrictions (
    id,
    road_segment_id,
    zone_id,
    vehicle_type,
    vehicle_types,
    severity,
    max_weight,
    max_height,
    time_from,
    time_to,
    days_of_week,
    allowed,
    description,
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    new_segment.id,
    NULL,
    NULL,
    ARRAY['truck']::text[], -- để array rỗng áp mọi xe: ARRAY[]::text[]
    'prohibited',
    NULL,
    NULL,
    '07:00',
    '09:00',
    ARRAY['Mon','Tue','Wed','Thu','Fri']::text[], -- cả tuần: ARRAY[]::text[]
    false,
    N'Cấm xe tải khung giờ cao điểm (mẫu SQL)',
    true,
    NOW(),
    NOW()
FROM new_segment;

COMMIT;

-- =============================================================================
-- COPY CSV (khi có nhiều dòng segment — cần file .csv đúng thứ tự cột)
-- Tạo file road_segments.csv với header, rồi:
--   \copy road_segments (id, zone_id, name, osm_id, geometry, one_way, speed_limit, lanes, road_type, "isActive", "createdAt", "updatedAt") FROM 'road_segments.csv' WITH (FORMAT csv, HEADER true);
-- Lưu ý: geometry là một ô text JSON, cần escape dấu ngoặc kép trong CSV theo chuẩn RFC.
-- Với người mới, INSERT/CTE ở trên thường dễ hơn \copy.
-- =============================================================================

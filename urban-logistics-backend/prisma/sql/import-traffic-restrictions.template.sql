-- =============================================================================
-- Import nhanh dữ liệu cấm / hạn chế đường (MySQL)
-- Bảng: road_segments (geometry GeoJSON) -> restrictions (khung giờ, loại xe, mức độ)
-- Chạy: mysql -u root -p logistic < prisma/sql/import-traffic-restrictions.template.sql
-- Hoặc dán vào GUI (DBeaver / phpMyAdmin) sau khi sửa ID / geometry.
-- =============================================================================
--
-- Thứ tự quan hệ:
--   zones (tuỳ chọn)  -->  road_segments (geometry = GeoJSON LineString, text)
--                         -->  restrictions (road_segment_id trỏ tới segment)
--
-- Quy ước tọa độ trong "geometry": [lng, lat] (chuẩn GeoJSON), không đảo lat/lng.
--
-- days_of_week / vehicle_types: cột JSON (MySQL không có kiểu mảng native).
--                Ví dụ: '["Mon","Tue"]'. Mảng rỗng '[]' = mọi ngày / mọi loại xe.
--
-- severity (màu bản đồ): prohibited | restricted | allowed_window
--
-- id là AUTO_INCREMENT — không truyền cột id, MySQL tự sinh.
--
-- =============================================================================
-- Bước 0: (tuỳ chọn) lấy zone_id có sẵn để gắn vào đoạn đường
-- =============================================================================
-- SELECT id, name FROM zones WHERE isActive = true;

-- =============================================================================
-- Mẫu 1 hàng: INSERT một đoạn đường rồi dùng LAST_INSERT_ID() cho restriction
-- (MySQL không hỗ trợ CTE + RETURNING như PostgreSQL)
-- =============================================================================

START TRANSACTION;

INSERT INTO road_segments (
    zone_id,
    name,
    osm_id,
    geometry,
    one_way,
    speed_limit,
    lanes,
    road_type,
    isActive,
    createdAt,
    updatedAt
)
VALUES (
    NULL, -- hoặc thay bằng id zone thật
    'Ví dụ — phố X (sửa tên)',
    NULL,
    '{"type":"LineString","coordinates":[[105.84,21.024],[105.842,21.026],[105.845,21.028]]}',
    false,
    NULL,
    NULL,
    'primary',
    true,
    NOW(),
    NOW()
);

SET @new_segment_id = LAST_INSERT_ID();

INSERT INTO restrictions (
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
    isActive,
    createdAt,
    updatedAt
)
VALUES (
    @new_segment_id,
    NULL,
    NULL,
    JSON_ARRAY('truck'), -- để rỗng áp mọi xe: JSON_ARRAY()
    'prohibited',
    NULL,
    NULL,
    '07:00',
    '09:00',
    JSON_ARRAY('Mon', 'Tue', 'Wed', 'Thu', 'Fri'), -- cả tuần: JSON_ARRAY()
    false,
    'Cấm xe tải khung giờ cao điểm (mẫu SQL)',
    true,
    NOW(),
    NOW()
);

COMMIT;

-- =============================================================================
-- LOAD DATA (khi có nhiều dòng segment — cần file .csv đúng thứ tự cột)
-- Tạo file road_segments.csv với header (không có cột id), rồi:
-- LOAD DATA LOCAL INFILE 'road_segments.csv'
--   INTO TABLE road_segments
--   FIELDS TERMINATED BY ',' ENCLOSED BY '"'
--   LINES TERMINATED BY '\n'
--   IGNORE 1 ROWS
--   (zone_id, name, osm_id, geometry, one_way, speed_limit, lanes, road_type, isActive, createdAt, updatedAt);
-- Lưu ý: geometry là một ô text JSON, cần escape dấu ngoặc kép trong CSV theo chuẩn RFC.
-- Với người mới, INSERT ở trên thường dễ hơn LOAD DATA.
-- =============================================================================

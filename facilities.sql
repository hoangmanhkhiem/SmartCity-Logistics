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
    INSERT INTO your_table_name (
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
    isActive,
    createdAt,
    updatedAt
) VALUES 
    (
        gen_random_uuid()::text,
        '0c6c755a-3cab-4852-bbd0-11a4570f4f1d',
        '82cc9f22-1ae6-4a77-b7c9-79f84a6ee59a',
        N'Hub GHTK Hai Bà Trưng',
        'hub',
        21.008,
        105.85,
        N'Số 200 Bạch Mai',
        400,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'c0810ca2-be89-4729-980b-2f178580fa18',
        '2d72c7c0-6a4b-4abc-85a6-e25057a5e6fb',
        N'Facility 11',
        'hub',
        21.03119148,
        105.8641246,
        NULL,
        300,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '0c6c755a-3cab-4852-bbd0-11a4570f4f1d',
        '95a51eb7-8ad1-4109-bd7d-91be32eca0bf',
        N'Facility 9',
        'charging_station',
        21.05646183,
        105.8895142,
        NULL,
        200,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '0c6c755a-3cab-4852-bbd0-11a4570f4f1d',
        '95a51eb7-8ad1-4109-bd7d-91be32eca0bf',
        N'Facility 17',
        'charging_station',
        21.04950224,
        105.8875366,
        NULL,
        600,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'cc8cb0d2-86ea-4071-b3d6-8167e0cf7e46',
        'd623c330-37bd-4577-8143-6df3f7d3a3bd',
        N'Facility 8',
        'warehouse',
        21.07788537,
        105.8775059,
        NULL,
        150,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'c0810ca2-be89-4729-980b-2f178580fa18',
        '95a51eb7-8ad1-4109-bd7d-91be32eca0bf',
        N'Trạm sạc ABC Đống Đa',
        'charging_station',
        21.015,
        105.82,
        N'Số 99 Láng Hạ',
        20,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'f9f42d73-cd73-4361-85f4-ba00d38b2523',
        '82cc9f22-1ae6-4a77-b7c9-79f84a6ee59a',
        N'Facility 12',
        'warehouse',
        21.06759431,
        105.803173,
        NULL,
        350,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '69c90eae-62b9-4471-bffb-d2a50f274a84',
        '409edeb2-e4d6-4422-a5ec-ee12786c8e8e',
        N'Facility 10',
        'fuel_station',
        21.08934725,
        105.8664271,
        NULL,
        250,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '69c90eae-62b9-4471-bffb-d2a50f274a84',
        'dccaf6e2-ba96-4388-b4b2-c8841c7ff945',
        N'MFC Shopee Hoàn Kiếm',
        'mfc',
        21.028,
        105.85,
        N'Số 10 Tràng Tiền',
        100,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'c0810ca2-be89-4729-980b-2f178580fa18',
        'd623c330-37bd-4577-8143-6df3f7d3a3bd',
        N'Trạm xăng ABC Ba Đình',
        'fuel_station',
        21.036,
        105.81,
        N'Số 1 Kim Mã',
        50,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'cc8cb0d2-86ea-4071-b3d6-8167e0cf7e46',
        '2d72c7c0-6a4b-4abc-85a6-e25057a5e6fb',
        N'Kho GHN Thanh Xuân',
        'warehouse',
        20.9933,
        105.798,
        N'Số 5 Khuất Duy Tiến',
        1000,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'b62aeb77-8dfb-49ab-a23b-4c991d257dd1',
        'dccaf6e2-ba96-4388-b4b2-c8841c7ff945',
        N'Facility 15',
        'hub',
        21.02892649,
        105.8800773,
        NULL,
        500,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '3dfa082d-693d-48e6-b900-61c08bf6f25a',
        '7e1e60d8-de37-4ae5-83b6-196f6ef22122',
        N'Facility 14',
        'fuel_station',
        21.00721894,
        105.8593208,
        NULL,
        450,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'f9f42d73-cd73-4361-85f4-ba00d38b2523',
        '82cc9f22-1ae6-4a77-b7c9-79f84a6ee59a',
        N'Facility 20',
        'warehouse',
        21.09545678,
        105.809042,
        NULL,
        750,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'b62aeb77-8dfb-49ab-a23b-4c991d257dd1',
        'dccaf6e2-ba96-4388-b4b2-c8841c7ff945',
        N'Facility 7',
        'hub',
        21.04589274,
        105.8832527,
        NULL,
        100,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'c0810ca2-be89-4729-980b-2f178580fa18',
        '2d72c7c0-6a4b-4abc-85a6-e25057a5e6fb',
        N'Facility 19',
        'hub',
        21.08420438,
        105.8317094,
        NULL,
        700,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'cc8cb0d2-86ea-4071-b3d6-8167e0cf7e46',
        '409edeb2-e4d6-4422-a5ec-ee12786c8e8e',
        N'Hub GHN Cầu Giấy',
        'hub',
        21.0285,
        105.78,
        N'Số 18 Phạm Hùng, Cầu Giấy',
        500,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'cc8cb0d2-86ea-4071-b3d6-8167e0cf7e46',
        'd623c330-37bd-4577-8143-6df3f7d3a3bd',
        N'Facility 16',
        'warehouse',
        21.07182273,
        105.8919977,
        NULL,
        550,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '419ffb14-fa5a-4056-810a-08989aa18756',
        '4e7fcc43-0a3a-4725-812c-3638c8e8f7fa',
        N'Facility 13',
        'charging_station',
        21.09763136,
        105.8460287,
        NULL,
        400,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '69c90eae-62b9-4471-bffb-d2a50f274a84',
        '409edeb2-e4d6-4422-a5ec-ee12786c8e8e',
        N'Facility 18',
        'fuel_station',
        21.06653795,
        105.8898169,
        NULL,
        650,
        NULL,
        NULL,
        NULL,
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        '419ffb14-fa5a-4056-810a-08989aa18756',
        '4e7fcc43-0a3a-4725-812c-3638c8e8f7fa', -- Giả định zone_id từ facility 13 cùng org
        N'Hub Viettel Post — Phạm Hùng',
        'hub',
        21.0285,
        105.78,
        N'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội',
        500,
        '07:00:00',
        '22:00:00',
        N'Hub trung tâm Viettel Post khu vực Cầu Giấy',
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

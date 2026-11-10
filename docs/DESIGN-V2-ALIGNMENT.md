# Alignment — Tài liệu thiết kế v2.0 (bản 6 vai trò)

Nguồn: [Tài liệu thiết kế hệ thống – Nền tảng Logistics Đô thị thông minh v2.0 (1).md](../Tài%20liệu%20thiết%20kế%20hệ%20thống%20–%20Nền%20tảng%20Logistics%20Đô%20thị%20thông%20minh%20v2.0%20(1).md)

## Vai trò (mục 2)

| Mã thiết kế | Seed / alias đang chạy |
|-------------|------------------------|
| `sys_admin` | `sys_admin` và `platform_admin` (UI cũ) |
| `regulator` | `regulator` |
| `org_admin` | `org_admin` (alias `carrier_ops` khi guard yêu cầu quản trị DN) |
| `org_staff` | `org_staff` (alias `carrier_ops`) |
| `member` | `member`, `shipper`, `consumer` |
| `researcher` | `researcher` (admin nền tảng cũng pass guard `researcher`) |
| `guest` | Không đăng nhập — `GET /public/*` |

Khảo sát **không** là role. Bảng `survey_assignments` giao nhiệm vụ cho bất kỳ user nào.

## API đã có theo tài liệu

| FR | Endpoint |
|----|----------|
| FR11 forms | `GET /api/v1/surveys/forms` |
| Giao việc | `POST /api/v1/surveys/assignments` |
| Việc của tôi | `GET /api/v1/surveys/assignments` |
| Nộp phiếu | `POST /api/v1/surveys/forms/:code/responses` |
| Duyệt | `PATCH /api/v1/surveys/responses/:id/review` |
| FR11.4 | `GET /api/v1/surveys/progress` |
| FR19 | `GET /api/v1/public/map-layers`, `GET /api/v1/public/zone-kpi` |

`code` phiếu: `shipper`, `last_mile_company`, `platform`, `logistics_company`, `regulator`.

## Chưa làm (vẫn trong lộ trình mục 12)

- Spatial UUID / 40 bảng (giữ INT + GeoJSON text để demo hiện tại chạy)
- Import CSV Google Form từng dòng (FR11.1), PWA offline (FR11.3), xuất SPSS (FR11.6)
- Worker, Redis, OR-Tools, OSRM, MinIO
- `POST /plans` job queue (FR5.1)

Chi tiết schema: [ARCHITECTURE-v2-gap.md](./ARCHITECTURE-v2-gap.md).

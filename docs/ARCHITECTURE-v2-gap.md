# Architecture v2.0 — migration gap (TypeORM baseline)

This document records what **remains** after migrating `apps/api` from Prisma to **NestJS + TypeORM + MySQL** while keeping the **current INT / GeoJSON-text** schema behavior.

Reference design: [Tài liệu thiết kế hệ thống v2.0](../Tài%20liệu%20thiết%20kế%20hệ%20thống%20–%20Nền%20tảng%20Logistics%20Đô%20thị%20thông%20minh%20v2.0.md) and [DESIGN-V2-ALIGNMENT.md](./DESIGN-V2-ALIGNMENT.md).

## Done in this migration

| Area | Status |
|------|--------|
| ORM | TypeORM entities mirror ~22 legacy Prisma models (int PKs, same table/column names) |
| Migrations | `migrations-typeorm/` baseline from legacy Prisma SQL + `20261110140000` provenance |
| Runtime | `DatabaseModule` (`migrationsRun: true`, `synchronize: false`) |
| API services | `@InjectRepository` / `DataSource.transaction` (no PrismaService) |

## Not yet v2.0 (intentionally deferred)

| Design v2.0 target | Current codebase |
|-------------------|------------------|
| ~40 tables, UUID v7 primary keys | ~22 tables, `INTEGER` auto-increment |
| MySQL spatial types (`POINT`, `POLYGON`, `LINESTRING`) | `DOUBLE` lat/lon + GeoJSON in `TEXT` (`boundary`, `geometry`, route `geometry`) |
| Normalized survey / partner / scenario modules | Single monolith schema; survey FR11 tables absent |
| Worker + BullMQ + OR-Tools + OSRM | Not in `apps/api` |
| 10 RBAC roles | 5 seeded roles (`platform_admin`, `regulator`, `carrier_ops`, `shipper`, `consumer`) |
| Full API-key scope matrix (FR9.2) | `orders:create` scope on `platform_api_clients` only |
| `POST /plans` async optimization | Heuristic route building in `RouteService` |

## Suggested next schema steps (when adopting v2.0)

1. Add parallel UUID columns or new tables per design doc; backfill from INT ids.
2. Introduce spatial columns and migrate GeoJSON helpers to DB-native geometry.
3. Split TypeORM migrations per epic (survey, partner portal, telemetry pipeline).
4. Replace `typeorm_migrations` tracking for greenfield installs; keep baseline no-op for existing DBs.

## Legacy SQL archive

Prisma migration folders under `apps/api/src/db/migrations/` are retained as the **source** for `1731240000000-InitialBaseline.ts` only. New changes must go through `apps/api/src/db/migrations-typeorm/`.

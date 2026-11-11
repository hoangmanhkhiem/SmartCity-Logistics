# Smart City Logistics (monorepo)

```
.
├── apps/
│   ├── api/          # NestJS + Prisma
│   └── web/          # Next.js
├── docker-compose.yml          # Dev (mặc định)
├── docker-compose.dev.yml      # include → docker-compose.yml
├── docker-compose.prod.yml     # Build image + prod
├── nginx/default.conf          # profile gateway (prod)
├── package.json                # npm workspaces
└── .env.example
```

## Dev bằng Docker (khuyến nghị)

Giống mẫu tempmail: mount repo, `npm install`, migrate, hot reload.

```bash
# Từ thư mục gốc D:\SmartCity-Logistics (không chạy trong apps/api)
cp .env.example .env
docker compose up -d
docker compose logs -f api
```

Trong Docker dev, **api** và **web** mỗi container chỉ mount `apps/api` hoặc `apps/web` và volume `node_modules` riêng (`api_node_modules`, `web_node_modules`).

Nếu lỗi `npm` / container thoát sớm:

```bash
docker compose down
docker volume rm smartcity-logistics_api_node_modules smartcity-logistics_web_node_modules
docker compose up -d --force-recreate
```

- Web: http://localhost:3000  
- API: http://localhost:3001/api/v1  
- Swagger: http://localhost:3001/api-docs  
- MySQL: `localhost:3307` (user/pass/db: `urban` / `urban` / `logistic`)

Lệnh tương đương chạy tay trên host:

```bash
docker compose up mysql -d
cd apps/api && npm install && npm run prisma:migrate && npm run start:dev
cd apps/web && npm install && npm run dev
```

Seed (tùy chọn, một lần):

```bash
docker compose exec api bash -lc "npm run db:seed"
```

## Dev không Docker

```bash
npm install
docker compose up mysql -d
npm run prisma:generate
npm run migration:deploy
npm run dev:api   # terminal 1
npm run dev:web   # terminal 2
```

## Prod / CI-CD (GHCR + VPS)

Push nhánh `main` build image lên `ghcr.io/<owner>/smartcity-logistics-api|web`. VPS pull image, không build trên máy chủ. Chi tiết: [deploy/README.md](deploy/README.md).

Chạy local từ image hoặc build tại chỗ:

```bash
cp .env.example .env
# Đổi DB_PASSWORD, JWT_SECRET, DOCKER_REGISTRY, IMAGE_TAG
docker compose -f docker-compose.prod.yml --profile gateway up -d
```

- Web qua Nginx: http://localhost (`NGINX_HTTP_PORT`)
- Web trực tiếp: http://localhost:3333 (`WEB_PORT`)
- API: http://localhost:3001 (`API_PORT`)

## Cấu trúc `apps/api/src`

| Thư mục | Vai trò |
|---------|---------|
| `config/` | Validate env (`DATABASE_URL` hoặc `DB_HOST` + …) |
| `db/` | Prisma schema & migrations |
| `http/` | App Nest, routes, middlewares |
| `jobs/` | Backfill scripts |

Web: `src/api/`, `src/components/`, `src/hooks/`, `src/app/` (Next App Router).

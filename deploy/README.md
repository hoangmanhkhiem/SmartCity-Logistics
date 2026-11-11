# VPS: `/opt/logistics` (chỉ `.env` + `docker-compose.yml`)

GitHub Secret **`VPS_PATH`** = `/opt/logistics`.

Trên VPS thay `docker-compose.yml` bằng file `deploy/docker-compose.yml` trong repo (copy nội dung). `.env` giữ nguyên, cần có:

```env
DB_NAME=logistic
DB_USER=urban
DB_PASSWORD=...
JWT_SECRET=...
DOCKER_REGISTRY=ghcr.io/hoangmanhkhiem
IMAGE_TAG=latest
NGINX_HTTP_PORT=80
```

Package GHCR private: thêm `GHCR_USER` / `GHCR_TOKEN` vào `.env` **và** GitHub Secrets (workflow đã login trước khi pull).

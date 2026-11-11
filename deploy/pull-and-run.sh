#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Thiếu file .env ở $ROOT — copy từ .env.example rồi điền JWT_SECRET, DB_PASSWORD."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

REGISTRY="${DOCKER_REGISTRY:-ghcr.io/hoangmanhkhiem}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

if [[ -n "${GHCR_TOKEN:-}" && -n "${GHCR_USER:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

export DOCKER_REGISTRY="$REGISTRY"
export IMAGE_TAG

docker compose -f docker-compose.prod.yml pull api web
docker compose -f docker-compose.prod.yml --profile gateway up -d --no-build --remove-orphans
docker compose -f docker-compose.prod.yml --profile gateway ps
docker image prune -f

echo "Đã chạy IMAGE_TAG=$IMAGE_TAG từ $REGISTRY"
echo "Web (nginx): http://$(hostname -I 2>/dev/null | awk '{print $1}'):${NGINX_HTTP_PORT:-80}"

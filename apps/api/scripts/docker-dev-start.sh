#!/usr/bin/env bash
set -euo pipefail
cd /app

npm_ci_retry() {
  local attempt=1
  local max=6
  while true; do
    if npm ci --no-audit --no-fund; then
      return 0
    fi
    if [ "$attempt" -ge "$max" ]; then
      echo "npm ci failed after ${max} attempts" >&2
      return 1
    fi
    echo "npm ci failed (attempt ${attempt}/${max}), retry in 10s..."
    attempt=$((attempt + 1))
    sleep 10
  done
}

lock_hash="$(md5sum package-lock.json | awk '{print $1}')"
need_install=0
if [ ! -d node_modules/@nestjs/core ]; then
  need_install=1
fi
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$lock_hash" ]; then
  need_install=1
fi

if [ "$need_install" -eq 1 ]; then
  npm_ci_retry
  echo "$lock_hash" > node_modules/.lock-hash
fi

wait_mysql() {
  local i
  for i in $(seq 1 30); do
    if node -e "
      const mysql = require('mysql2/promise');
      mysql.createConnection(process.env.DATABASE_URL)
        .then((c) => c.end())
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    "; then
      return 0
    fi
    echo "waiting for mysql (${i}/30)..."
    sleep 2
  done
  echo "mysql not reachable via DATABASE_URL" >&2
  return 1
}

wait_mysql
npm run migration:run
exec npm run start:dev

#!/usr/bin/env bash
# Suite Playwright de efectos (F0): build + Nitro loopback + e2e/fx-smoke.spec.ts
set -euo pipefail

PORT="${E2E_PORT:-4175}"
BASE="http://127.0.0.1:${PORT}"

echo "[test:e2e] build de producción"
pnpm run build

if [ ! -f .output/server/index.mjs ]; then
  echo "[test:e2e] no se generó .output/server/index.mjs" >&2
  exit 1
fi

echo "[test:e2e] arrancando Nitro en ${BASE}"
HOST=127.0.0.1 NITRO_HOST=127.0.0.1 NITRO_PORT="${PORT}" PORT="${PORT}" \
  node .output/server/index.mjs >nitro-e2e.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

ready=0
for _ in $(seq 1 60); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[test:e2e] el servidor Nitro murió al arrancar" >&2
    cat nitro-e2e.log >&2 || true
    exit 1
  fi
  if curl -fsS -o /dev/null "${BASE}/" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 0.5
done

if [ "$ready" != "1" ]; then
  echo "[test:e2e] timeout esperando a ${BASE}/" >&2
  cat nitro-e2e.log >&2 || true
  exit 1
fi

echo "[test:e2e] Playwright"
E2E_BASE_URL="${BASE}" E2E_PORT="${PORT}" pnpm exec playwright test

echo "[test:e2e] OK"

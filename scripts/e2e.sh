#!/usr/bin/env bash
# Verificación e2e determinista para pre-commit: build de producción + arranque
# Nitro en loopback + a11y-pass + browser-smoke (espejo del job `browser` de CI).
set -euo pipefail

PORT="${E2E_PORT:-4173}"
BASE="http://127.0.0.1:${PORT}"

echo "[e2e] build de producción"
pnpm run build

if [ ! -f .output/server/index.mjs ]; then
  echo "[e2e] no se generó .output/server/index.mjs" >&2
  exit 1
fi

echo "[e2e] arrancando Nitro en ${BASE}"
HOST=127.0.0.1 NITRO_HOST=127.0.0.1 NITRO_PORT="${PORT}" PORT="${PORT}" \
  node .output/server/index.mjs >nitro-e2e.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

ready=0
for _ in $(seq 1 60); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[e2e] el servidor Nitro murió al arrancar" >&2
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
  echo "[e2e] timeout esperando a ${BASE}/" >&2
  cat nitro-e2e.log >&2 || true
  exit 1
fi

mkdir -p artifacts
A11Y_URL="${BASE}/" node scripts/a11y-pass.mjs
node scripts/browser-smoke.mjs "${BASE}/" artifacts/desktop.png

echo "[e2e] OK"

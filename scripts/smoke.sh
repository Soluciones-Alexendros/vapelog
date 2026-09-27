#!/usr/bin/env bash
# Smoke temporal: sirve el build de producción y exige HTTP 200 en las rutas
# principales. Otro agente lo pulirá (Playwright, más rutas, regresiones).
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${SMOKE_PORT:-4173}"
BASE="http://127.0.0.1:${PORT}"

if [ -f dist/server/server.js ]; then
  echo "smoke: sirviendo con 'vite preview' (artefacto dist/)" >&2
elif [ -f .output/server/index.mjs ]; then
  echo "smoke: artefacto legacy .output detectado; usando vite preview" >&2
else
  echo "smoke: sin build previo; ejecutando pnpm build" >&2
  pnpm build
fi

pnpm exec vite preview --port "$PORT" --strictPort &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "$BASE/" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

MARKER="Vapelog"
for path in / /dispositivos; do
  body="$(mktemp)"
  code="$(curl -sS -o "$body" -w "%{http_code}" "$BASE$path")"
  echo "smoke: GET $path -> $code"
  if [ "$code" != "200" ]; then
    echo "smoke: FAIL $path (esperado 200, recibido $code)" >&2
    rm -f "$body"
    exit 1
  fi
  if ! grep -q "$MARKER" "$body"; then
    echo "smoke: FAIL $path (falta marcador '$MARKER' en el body)" >&2
    rm -f "$body"
    exit 1
  fi
  rm -f "$body"
done
echo "smoke: OK"

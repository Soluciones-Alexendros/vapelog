#!/usr/bin/env bash
# Smoke: sirve el build de producción y exige HTTP 200 + marcador en el body.
# Determinista, ≤5 min. Fallar si el servidor no arranca.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${SMOKE_PORT:-4173}"
BASE="http://127.0.0.1:${PORT}"
LOG="$(mktemp)"
MARKER="Vapelog"

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$LOG"
}
trap cleanup EXIT

if [ ! -d dist/client ] || [ ! -f dist/server/server.js ]; then
  echo "smoke: sin build previo; ejecutando pnpm build" >&2
  pnpm build
fi

echo "smoke: arrancando vite preview en :${PORT}" >&2
pnpm exec vite preview --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 &
SERVER_PID=$!

ready=0
for _ in $(seq 1 90); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "smoke: el servidor murió al arrancar" >&2
    cat "$LOG" >&2 || true
    exit 1
  fi
  if curl -fsS -o /dev/null "$BASE/" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 0.5
done

if [ "$ready" != "1" ]; then
  echo "smoke: timeout esperando $BASE/" >&2
  cat "$LOG" >&2 || true
  exit 1
fi

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

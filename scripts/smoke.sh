#!/usr/bin/env bash
# Smoke: sirve el build de producción y exige HTTP 200 + marcador de contenido
# real por ruta, y HTTP 404 real en una ruta inexistente.
# Determinista, ≤5 min. Fallar si el servidor no arranca.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${SMOKE_PORT:-4173}"
BASE="http://127.0.0.1:${PORT}"
LOG="$(mktemp)"

# Marcador por ruta: contenido real servido en SSR (ver src/routes y src/data).
markerFor() {
  case "$1" in
    /) echo "El catálogo" ;;
    /dispositivos) echo "XROS 4" ;;
    /resistencias) echo "Z 0,2" ;;
    /liquidos) echo "Heisenberg sales 20 mg" ;;
    /buscar) echo "Buscar" ;;
    /herramientas) echo "Cálculo" ;;
    /compatibilidad) echo "Cruce" ;;
    /archivo) echo "Tabla del archivo" ;;
    *) return 1 ;;
  esac
}

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$LOG"
}
trap cleanup EXIT

if [ ! -f .output/server/index.mjs ] && [ ! -d dist/client ]; then
  echo "smoke: sin build previo; ejecutando pnpm build" >&2
  pnpm build
fi

if [ -f .output/server/index.mjs ]; then
  echo "smoke: arrancando Nitro (.output) en :${PORT}" >&2
  PORT="$PORT" HOST=127.0.0.1 NITRO_HOST=127.0.0.1 NITRO_PORT="$PORT" \
    node .output/server/index.mjs >"$LOG" 2>&1 &
  SERVER_PID=$!
else
  echo "smoke: arrancando vite preview en :${PORT}" >&2
  pnpm exec vite preview --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 &
  SERVER_PID=$!
fi

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

for path in / /dispositivos /resistencias /liquidos /buscar /herramientas /compatibilidad /archivo; do
  marker="$(markerFor "$path")"
  body="$(mktemp)"
  code="$(curl -sS -o "$body" -w "%{http_code}" "$BASE$path")"
  echo "smoke: GET $path -> $code"
  if [ "$code" != "200" ]; then
    echo "smoke: FAIL $path (esperado 200, recibido $code)" >&2
    rm -f "$body"
    exit 1
  fi
  if ! grep -qF "$marker" "$body"; then
    echo "smoke: FAIL $path (falta marcador '$marker' en el body)" >&2
    rm -f "$body"
    exit 1
  fi
  rm -f "$body"
done

notfound="$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/dispositivos/no-existo-404")"
echo "smoke: GET /dispositivos/no-existo-404 -> $notfound"
if [ "$notfound" != "404" ]; then
  echo "smoke: FAIL /dispositivos/no-existo-404 (esperado 404, recibido $notfound)" >&2
  exit 1
fi
echo "smoke: OK"

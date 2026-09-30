# Guía — Línea base del humo (S0, plan v2 §6)

### Propósito de este documento

- **Objetivos:** Fijar la línea base del humo actual
  (`src/components/smoke-canvas.tsx`: 30 fps, 14–28 orbes bokeh, velocidad por
  frame no por dt) ANTES de que se sustituya, con números de bench y
  evidencias de S1/S4/S5 reproducibles.
- **Estructura:** Entorno → implementación actual → `smoke-bench` →
  números bench → tabla de capturas → evidencias S1/S4/S5 → checklist S0.
- **Contenido a integrar según contexto:** Mediciones del 2026-09-29 contra el
  build de producción local (`pnpm run build` + `.output/server/index.mjs` +
  Playwright Chromium headless). No inventar datos: regenerar con
  `node scripts/smoke-bench.mjs`.

## Entorno de captura

- Rama `feat/humo-v2`; build con `pnpm run build` (primera acción, para que el
  servidor de pruebas `.output/server/index.mjs` quede congelado y las
  ediciones posteriores de otros agentes no le afecten).
- Servidor: `process.execPath .output/server/index.mjs` con
  `PORT`/`HOST`/`NITRO_HOST`/`NITRO_PORT` en `127.0.0.1`, espera hasta
  60×500 ms con `fetch` ok (patrón de `scripts/visual-smoke.mjs`).
- Playwright `chromium.launch({ headless: true, args: ['--no-sandbox',
'--disable-dev-shm-usage'] })`; puerta de edad saltada con
  `context.addInitScript(() => sessionStorage.setItem("vapelog-edad", "ok"))`.
- Tema fijado con `localStorage "vapelog-theme"` + clase `dark` +
  `colorScheme` (el `themeBootScript` lee `localStorage` y `matchMedia`).
- Medición en loopback local: sirve para comparar antes/después, no como dato
  de campo.

## Implementación actual (resumen)

`src/components/smoke-canvas.tsx`:

- `MAX_FPS = 30`, `FRAME_INTERVAL = 1000 / MAX_FPS` (lín. 4–5); el `draw`
  descarta frames por debajo del intervalo (lín. 120–124): throttle por
  **frame, no por dt**.
- `MIN_PARTICLES = 14`, `MAX_PARTICLES = 28` interpolados por ancho
  (`particleCountFor`, lín. 25–28).
- Velocidad por frame: `vx ±0.08`, `vy -(0.03–0.12)` px/frame (lín. 69–70);
  el `draw` suma sin multiplicar por dt (lín. 128–129).
- `RESOLUTION_SCALE = 0.5` aplicado sobre `devicePixelRatio` sin tope
  (lín. 106–110); cada `resize` regenera todas las partículas
  (`resize` lín. 104–112, `onResize` lín. 163–166, listener lín. 181).
- Opacidad `0.12` (claro) / `0.16` (oscuro), sprite radial de 128 px
  (lín. 9–13, 47–61).

## Banco de pruebas (`scripts/smoke-bench.mjs`)

CLI: `node scripts/smoke-bench.mjs [--seconds 10] [--route /]
[--theme light|dark] [--width 1280] [--dpr 1]`
(paquete: `"smoke-bench": "node scripts/smoke-bench.mjs"`).

Dentro de `page.evaluate`, bucle rAF durante `seconds` registrando deltas de
frame + `PerformanceObserver('longtask')`. Imprime JSON
`{ route, theme, width, dpr, seconds, meanMs, p95Ms, longtasks, frames }` más
una línea humana. **Exit 0 siempre** (en CI es informativo, no puerta).

Matiz: el bench mide el rAF de la página (vsync del display, ~60 Hz), no los
`draw` del humo (throttle interno a 30 fps). Un `mean ≈ 16.6 ms` con
`longtasks = 0` significa "la página no introduce jank a nivel de rAF";
el coste real de pintado del humo se estima por separado (S1/S5).

## Números bench (10 s en `/`, claro+oscuro a 1280, y pasada móvil a 360)

| Ruta | Tema   | Ancho | DPR |   s | meanMs | p95Ms | frames | longtasks |
| ---- | ------ | ----: | --: | --: | -----: | ----: | -----: | --------: |
| `/`  | claro  |  1280 |   1 |   5 |  16.63 |  16.7 |    301 |         0 |
| `/`  | claro  |  1280 |   1 |  10 |  16.65 |  16.7 |    601 |         0 |
| `/`  | oscuro |  1280 |   1 |  10 |  16.64 |  16.7 |    602 |         0 |
| `/`  | claro  |   360 |   1 |  10 |  16.66 |  16.8 |    601 |         0 |

Comando de verificación S0 (exit 0):
`node scripts/smoke-bench.mjs --seconds 5` →
`{"route":"/","theme":"light","width":1280,"dpr":1,"seconds":5,"meanMs":16.63,"p95Ms":16.7,"longtasks":0,"frames":301}`.

## Tabla de capturas (rutas × temas × anchos)

S0 no persiste PNG nuevos (ámbito: solo `scripts/smoke-bench.mjs`,
una línea en `package.json` y este doc). La matriz de referencia F0 ya existe
en `docs/guides/baseline/` (30 PNG, nomenclatura
`<ruta>-<tema>-<ancho>.png` con `home` = `/` y `ficha` =
`/dispositivos/vaporesso-xros-4`):

| Ruta                             | Claro (360/768/1280)       | Oscuro (360/768/1280)       |
| -------------------------------- | -------------------------- | --------------------------- |
| `/`                              | `home-claro-*.png`         | `home-oscuro-*.png`         |
| `/dispositivos`                  | `dispositivos-claro-*.png` | `dispositivos-oscuro-*.png` |
| `/dispositivos/vaporesso-xros-4` | `ficha-claro-*.png`        | `ficha-oscuro-*.png`        |
| `/resistencias`                  | `resistencias-claro-*.png` | `resistencias-oscuro-*.png` |
| `/comparar`                      | `comparar-claro-*.png`     | `comparar-oscuro-*.png`     |

Las evidencias dinámicas S1/S4/S5 son lecturas cuantitativas del backing store
(`getImageData`, método documentado abajo); no se guardaron PNG sueltos para
no ampliar el ámbito de S0.

## Evidencias

### S1 — Movimiento imperceptible

Cálculo documentado (código, lín. 69–70 y 128–129):
`vy = 0.03–0.12 px/frame × 30 fps = 0.9–3.6 px/s` → como máximo ~36 px en
10 s (~54 px en 15 s) sobre orbes de 48–144 px de radio con alfa máxima
medida de 30/255 (~0.12). Desplazamiento sub-radio con contraste mínimo:
imperceptible en la práctica.

Lecturas del backing store (640×450, `/` claro 1280, alfa>4/255 cuenta como
"pintado"):

| t    | píxeles pintados | suma alfa | alfa máx |
| ---- | ---------------: | --------: | -------: |
| 0 s  |           49 039 |   570 924 |       30 |
| 5 s  |           52 817 |   610 781 |       27 |
| 15 s |           54 176 |   632 513 |       30 |

Deriva del canal alfa: 0→5 s `mean 0.00413, changedFrac 0.09164`;
5→15 s `mean 0.00912, changedFrac 0.21458` (fracción de píxeles con
Δalfa>4). El humo pinta (~17–19 % del backing store) pero apenas se mueve:
coherente con el cálculo.

Nota metodológica: un primer intento con capturas de elemento + sharp dio
`meanAbsDiff 0.00` (redondeo a 2 decimales) y `changedFrac 0` con umbral

> 12 — sensibilidad insuficiente para una señal de alfa ≤30. Se pasó a
> readback del backing store, que sí la resuelve. Regenerar: evaluar
> `getImageData` en t=0/5/15 s sobre `/` (ver traza en el historial de S0).

### S4 — Resize regenera partículas

Código: `resize()` (lín. 104–112) redimensiona el backing store y llama a
`makeParticles(...)` — tira todas las partículas y crea otras aleatorias;
`onResize` (lín. 163–166) lo invoca en cada `resize` de ventana (listener
lín. 181). No hay preservación de estado: cualquier cambio de tamaño
reinicia el campo por completo.

Evidencia (`page.setViewportSize` variando solo el alto 900→800, intersección
640×400 del backing store, umbral Δalfa>4):

| Momento                     | backing store | meanAlphaDiff | changedFrac |
| --------------------------- | ------------- | ------------: | ----------: |
| Control: 700 ms sin resize  | 640×450       |       0.00064 |         0.0 |
| Tras resize solo-alto a 800 | 640×400       | 0.01601 (25×) |     0.33121 |

Un 33 % de los píxeles cambia de golpe frente al 0 % de la deriva natural:
reinicio, no movimiento continuo.

### S5 — Resolución sin tope

Código (lín. 106–110): `scale = (devicePixelRatio || 1) × 0.5`,
`canvas.width = floor(width × scale)` — sin `Math.min` superior (solo suelo
`Math.max(1, …)`).

Evidencia (contexto `deviceScaleFactor: 3`, viewport 1280×900, `/` claro):

```json
{ "canvasWidth": 1920, "canvasHeight": 1350, "innerWidth": 1280, "innerHeight": 900, "dpr": 3 }
```

`canvas.width / innerWidth = 1.500` = 3 × 0.5 exacto: a DPR 3 el backing
store es 1920×1350 (2.6 Mpx) sin tope. A DPR 1 el ratio es 0.5 (640×450).
Regenerar: contexto con `deviceScaleFactor: 3` y loguear
`canvas.width / window.innerWidth`.

## Checklist S0 (plan v2 §6)

- [x] `pnpm run build` como primera acción (servidor `.output/server/index.mjs`
      autocontenido; build OK).
- [x] `scripts/smoke-bench.mjs` creado con patrones de `visual-smoke.mjs` y
      `a11y-pass.mjs` (guard loopback, `ensureServer`, salto de puerta de edad,
      Chromium headless con `--no-sandbox --disable-dev-shm-usage`); rutas,
      anchos 360/768/1280 y CLI con `--seconds/--route/--theme/--width/--dpr`.
- [x] Línea `"smoke-bench": "node scripts/smoke-bench.mjs"` añadida a
      `package.json` (único cambio en ese fichero).
- [x] `node --check scripts/smoke-bench.mjs` OK;
      `node scripts/smoke-bench.mjs --seconds 5` corre en local con exit 0.
- [x] Traza bench 10 s en `/` (claro+oscuro, 1280) + pasada móvil (360):
      tabla arriba, 0 longtasks en las 4 pasadas.
- [x] S1: cálculo 0.9–3.6 px/s + readbacks 0/5/15 s documentados.
- [x] S4: `setViewportSize` solo-alto + par código `onResize→makeParticles` +
      contraste deriva (0.0) frente a reshuffle (0.33).
- [x] S5: `deviceScaleFactor: 3` → ratio 1.500 logueado, sin tope.
- [x] Este doc (`docs/guides/humo-baseline.md`, español) con tabla de
      capturas, números bench y evidencias S1/S4/S5.

Bloqueos: ninguno. Nota: no se ejecutó el suite completo de tests (otros
agentes trabajan en `src/`); solo `node --check` del script nuevo, según lo
pedido.

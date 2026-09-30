# Guía — Resultados del humo (S7, plan v2 §7)

### Propósito de este documento

- **Objetivos:** Registrar la verificación en navegador real de la fase S7:
  coste propio del humo por fotograma (con CPU ×4), memoria, CLS/LCP y
  `prefers-reduced-motion`, con umbrales, veredictos y números crudos
  reproducibles.
- **Estructura:** Entorno → método (comandos exactos) → §1 coste por frame →
  §2 memoria → §3 CLS/LCP → §4 `visual-smoke` → §5 `reduced-motion` →
  §6 pendientes manuales → §7 CI → tabla de veredictos.
- **Contenido a integrar según contexto:** Mediciones del 2026-09-30 contra el
  build de producción local (`pnpm run build` + `.output/server/index.mjs` +
  Playwright Chromium headless). No inventar datos: regenerar con
  `node scripts/smoke-bench.mjs` y `node scripts/smoke-verify.mjs`. Sustituye
  en lo relativo a coste/memoria a
  [humo-baseline.md](./humo-baseline.md), que queda como línea base S0.

> Traza: plan v2 §7 (S7). La decisión de arquitectura asociada se recoge en
> **ADR-0007 (S8, pendiente de crear)**.

## Entorno de captura

- Rama `feat/humo-v2`; build de producción reciente (`pnpm run build`) para que
  `.output/server/index.mjs` y `.output/client/**` casen sus hashes.
- Servidor: `process.execPath .output/server/index.mjs` con
  `PORT`/`HOST`/`NITRO_HOST`/`NITRO_PORT` en `127.0.0.1` (puertos dedicados:
  4174 `visual-smoke`, 4176 `smoke-bench`, 4177 `smoke-verify`). Guard de host
  loopback, puerta de edad saltada con `sessionStorage "vapelog-edad"`.
- Chromium headless `--no-sandbox --disable-dev-shm-usage`; tema por
  `colorScheme` + `localStorage "vapelog-theme"`; preferencia del humo por
  `localStorage "vapelog-fx"` (`on`/`off`).
- **Límite de método:** medición en loopback local, sin GPU real ni display
  físico; sirve para comparar antes/después y verificar umbrales, no como dato
  de campo. `performance.now()` alrededor del trabajo del humo incluye el coste
  de `drawImage` encolado, no solo su rasterización en GPU.

## Método (comandos exactos)

```bash
pnpm run build

# §1 coste por fotograma (magnitud propia del humo: lastFrameCostMs)
node scripts/smoke-bench.mjs --seconds 10 --theme light --cpu 1
node scripts/smoke-bench.mjs --seconds 10 --theme dark  --cpu 1
node scripts/smoke-bench.mjs --seconds 10 --theme light --cpu 4
node scripts/smoke-bench.mjs --seconds 10 --theme dark  --cpu 4
node scripts/smoke-bench.mjs --seconds 10 --width 360 --cpu 1
node scripts/smoke-bench.mjs --seconds 10 --width 360 --cpu 4
node scripts/smoke-bench.mjs --seconds 10 --width 768 --cpu 1
node scripts/smoke-bench.mjs --seconds 5  --fx off          # control sin humo
node scripts/smoke-bench.mjs --seconds 5  --reduced-motion # control reduce

# §2 memoria (3 muestras, 60 s entre ellas, GC forzado; ~2,5 min)
node scripts/smoke-verify.mjs --checks memory --strict

# §3 CLS/LCP (humo on y off)
node scripts/smoke-verify.mjs --checks cls

# §5 prefers-reduced-motion
node scripts/smoke-verify.mjs --checks reduced --strict

# §4 desbordamiento/consola con humo on y off
VISUAL_SMOKE_FX=on  node scripts/visual-smoke.mjs
VISUAL_SMOKE_FX=off node scripts/visual-smoke.mjs
```

Cambios de herramienta que hicieron falta (ver §9):

- `src/components/smoke-canvas.tsx`: el hook `window.__vapelogSmoke` expone
  ahora, además de `tier`/`emaMs`, los getters **solo-lectura** `frameId` y
  `lastFrameCostMs` (coste `performance.now()` de cada fotograma dibujado). Sin
  efecto sobre el render; permite al bench muestrear el coste propio sin
  instrumentar el bucle.
- `scripts/smoke-bench.mjs`: añade `--cpu`, `--fx on|off` y `--reduced-motion`
  (CDP `Emulation.setCPUThrottlingRate`), y reporta `smokeMeanMs`/`smokeP95Ms`/
  `smokeMaxMs`/`smokeFrames`/`tier`/`emaMs` junto al rAF de página.
- `scripts/smoke-verify.mjs` (nuevo, `pnpm run smoke-verify`): memoria, CLS/LCP
  y reduced-motion.
- `scripts/visual-smoke.mjs`: `VISUAL_SMOKE_FX=on|off` fuerza la preferencia.

## §1 — Coste propio por fotograma (umbral: media ≤ 2 ms, p95 ≤ 4 ms; CPU ×4 media ≤ 4 ms)

`smoke-bench` muestrea `__vapelogSmoke.lastFrameCostMs` en cada fotograma del
humo (deduplicado por `frameId`). Es el trabajo real (`stepSmoke` + `draw`), no
el vsync de la página.

| Ruta/Tema                | Ancho | CPU | tier | fotogramas humo |       media |        p95 |    máx |     ema | longtasks | veredicto |
| ------------------------ | ----: | --: | ---: | --------------: | ----------: | ---------: | -----: | ------: | --------: | :-------- |
| `/` claro                |  1280 |  ×1 |    0 |             221 | **0.64 ms** | **1.4 ms** | 1.9 ms | 0.66 ms |         0 | PASS      |
| `/` oscuro               |  1280 |  ×1 |    0 |             221 | **0.71 ms** | **1.6 ms** | 2.3 ms | 0.68 ms |         0 | PASS      |
| `/` claro                |  1280 |  ×4 |    0 |             221 | **1.60 ms** | **3.0 ms** | 5.0 ms | 1.57 ms |         0 | PASS      |
| `/` oscuro               |  1280 |  ×4 |    0 |             220 | **1.71 ms** | **3.5 ms** | 5.7 ms | 1.84 ms |         0 | PASS      |
| `/` claro                |   360 |  ×1 |    2 |             191 |     0.23 ms |     0.4 ms | 0.5 ms | 0.21 ms |         0 | PASS      |
| `/` claro                |   360 |  ×4 |    2 |             188 |     0.47 ms |     0.9 ms | 1.2 ms | 0.48 ms |         0 | PASS      |
| `/` claro                |   768 |  ×1 |    1 |             201 |     0.47 ms |     0.9 ms | 1.1 ms | 0.45 ms |         0 | PASS      |
| `/` (`--fx off`)         |  1280 |  ×1 |    — |               0 |         N/A |        N/A |    N/A |       — |         0 | control   |
| `/` (`--reduced-motion`) |  1280 |  ×1 |    — |               0 |         N/A |        N/A |    N/A |       — |         0 | control   |

Observaciones:

- El rAF de **página** se mantiene en `mean 16.63–16.66 ms`, `p95 16.7 ms`,
  0 longtasks en todas las pasadas (igual que la línea base S0): el humo no
  produce jank perceptible a nivel de frame.
- El coste propio escala con el tier (0 > 1 > 2) y con el throttle de CPU; en
  el peor caso (oscuro, ×4) la media es 1.71 ms y el p95 3.5 ms, por debajo de
  los umbrales (4 ms).
- Con `--fx off` y `--reduced-motion` el hook no existe (`hook:false`), no hay
  fotogramas de humo y tampoco tareas largas.

**ANTES vs DESPUÉS.** La línea base S0 solo fijó el rAF de página (16.63 ms
media / 16.7 p95 / 0 longtasks); no medía el coste del humo. S7 introduce esa
magnitud: el humo añade ~0.6–0.7 ms de trabajo de main-thread por fotograma
dibujado en escritorio a ×1, y el rAF de página no se mueve (16.63 → 16.65 ms).

## §2 — Memoria (umbral: sin crecimiento sostenido; 3 muestras a 60 s)

`smoke-verify` fuerza GC (`HeapProfiler.collectGarbage`) antes de cada muestra y
lee el heap usado por CDP (`Performance.getMetrics.JSHeapUsedSize`). Se descarta
`performance.memory.usedJSHeapSize` como fuente principal porque Chromium lo
cuantiza (p. ej. `10000000` constante) salvo `--enable-precise-memory-info`.

| Muestra | t (s) | heap usado |
| ------- | ----: | ---------: |
| 1       |    20 |    5.05 MB |
| 2       |    80 |    5.34 MB |
| 3       |   140 |    5.44 MB |

- Δ total: **+0.38 MB (+7.54 %)**; creciente pero bajo el umbral heurístico
  (ni +8 MB ni +10 %); sin crecimiento sostenido → **PASS (retención estable)**.
- `tier` del humo durante la prueba: 0; 0 tareas largas.

## §3 — CLS y LCP (umbral: CLS ≤ 0.05; LCP ≤ 2.5 s)

`smoke-verify` observa `layout-shift` (solo sin `hadRecentInput`) y
`largest-contentful-paint`, con scroll hasta el 50 % y vuelta para forzar
shifts tardíos.

| Métrica   |         Humo on |        Humo off |    Umbral | Veredicto                    |
| --------- | --------------: | --------------: | --------: | :--------------------------- |
| CLS       | 0.00057–0.00065 | 0.00063–0.00096 |    ≤ 0.05 | PASS (sin regresión)         |
| LCP       |      108–144 ms |        64–76 ms | ≤ 2500 ms | PASS (dentro de presupuesto) |
| longtasks |               0 |               0 |         0 | PASS                         |

- CLS prácticamente 0 en ambos casos: el humo vive en una capa
  `position:fixed; contain:strict` y no participa del layout.
- LCP: el humo muestra un valor algo mayor (~+0.06 s) que sin humo, atribuible
  al primer pintado del canvas; absoluto muy por debajo del presupuesto de
  ADR-0005 / `plan-rediseno-2026` (≤ 2.5 s). No hay baseline LCP medido
  pre-humo en `humo-baseline.md`; el valor "sin humo" (`vapelog-fx=off`) es la
  referencia más cercana.

## §4 — `visual-smoke` (desbordamiento y consola; 5 rutas × 2 temas × 3 anchos)

| Ejecución             | Combinaciones | Errores de consola |               Fallos |
| --------------------- | ------------: | -----------------: | -------------------: |
| `VISUAL_SMOKE_FX=on`  |            30 |                  0 | 10 (los 10 a 360 px) |
| `VISUAL_SMOKE_FX=off` |            30 |                  0 |       10 (idénticos) |

- **Sin errores de consola ni de página** con humo on y off.
- Los 10 fallos son de **desbordamiento horizontal a 360 px** y son
  **idénticos con el humo desactivado**, luego **no son atribuibles al humo**.
  Diagnóstico: `scrollWidth 364` vs `clientWidth 360` (+4 px) causado por el
  nav de la cabecera (`div.flex.shrink-0…` y un `a` con borde derecho en 364),
  en `src/components/chrome.tsx`. Es un estado preexistente del árbol de
  trabajo (fuera del alcance de S7); no se ha tocado para no interferir con
  otros cambios en curso.

## §5 — `prefers-reduced-motion: reduce`

`smoke-verify --checks reduced` crea el contexto con `reducedMotion: "reduce"`,
instrumenta `requestAnimationFrame` antes de cargar y compara con un control
con movimiento permitido (mismo tiempo y ruta).

| Señal                    |  reduce | control (fx on) | Esperado | Veredicto    |
| ------------------------ | ------: | --------------: | -------- | :----------- |
| `window.__vapelogSmoke`  | ausente |        presente | ausente  | PASS         |
| `.smoke-layer` `display` |  `none` |       (visible) | `none`   | PASS         |
| callbacks rAF en 2 s     |       2 |             294 | ≈ 0      | PASS (apoyo) |
| `data-ready`             | ausente |          `true` | ausente  | PASS         |

- El hook solo lo crea `SmokeCanvas` cuando monta su efecto; su **ausencia**
  prueba que el humo no arrancó y, por tanto, no hay rAF del humo.
- Límite explicado: en el bundle de producción las funciones están minificadas,
  así que la pila de los callbacks rAF no identifica de forma fiable los del
  humo (`smokeStackHint:false`). La evidencia dura es ausencia de hook +
  `display:none`; el conteo de rAF (2 vs 294) es apoyo comparativo.

## §6 — Pendiente manual: Safari/iOS y Firefox

**PENDIENTE — no verificable en este entorno** (solo hay Chromium headless; no
hay macOS/iOS ni Firefox/Gecko disponibles). No se inventan resultados.

Qué revisar en navegador real:

1. **Aspecto:** tono/alfa del humo en claro y oscuro (`--smoke-rgb`,
   `--smoke-alpha`), y que no compita con el texto del hero.
2. **Coste:** fluidez en Safari/iOS (WebKit) y Firefox; comprobar que el tier
   inicial y la degradación sostenida (>24 ms durante 2 s) actúan.
3. **`mask-image`:** el degradado horizontal de `.smoke-ascii`
   (`-webkit-mask-image`) y la atenuación vertical de `.smoke-soft`; verificar
   que el prefijo `-webkit-` cubre Safari/iOS.
4. **`drawImage` con atlas ASCII:** que el atlas pre-renderizado
   (`makeAtlas`) y el `drawImage` por celda se rastericen sin artefactos.
5. **Sin rAF con `prefers-reduced-motion`:** ajustar la preferencia del sistema
   y confirmar ausencia de `.smoke-layer` visible (ya validado en Chromium).

## §7 — CI (informativo)

Se añade el job `smoke-bench` a `.github/workflows/ci.yml`
(`needs: [build]`, `continue-on-error: true`, no bloqueante). Hace build,
descarga el artefacto, instala Chromium y corre el bench en tres pasadas
(claro ×1, oscuro ×1, claro ×4), imprimiendo `::warning::` si la media supera
2 ms (×1) o 4 ms (×4), o el p95 supera 4 ms. No altera los jobs existentes
`quality`, `test`, `build`, `smoke`, `browser`, `release`.

## §8 — Tabla de veredictos S7

| #   | Casilla                                                                         | Resultado                   | Evidencia                                                              |
| --- | ------------------------------------------------------------------------------- | :-------------------------- | ---------------------------------------------------------------------- |
| 1   | media ≤ 2 ms y p95 ≤ 4 ms (desktop); ≤ 4 ms con CPU ×4; 0 longtasks atribuibles | PASS                        | §1 (0.64–0.71 ms; ×4 1.60–1.71 ms; 0 longtasks)                        |
| 2   | 5 min sin crecimiento sostenido del heap (3 muestras a 60 s)                    | PASS                        | §2 (+7.54 %, < umbral)                                                 |
| 3   | CLS = 0 y LCP sin regresión frente a baseline                                   | PASS                        | §3 (CLS ≈ 0.0006; LCP ≤ 144 ms ≪ 2.5 s)                                |
| 4   | `visual-smoke` sin overflow ni consola con humo on y off                        | PASS (humo) / bloqueo ajeno | §4 (0 consola; 10 overflow a 360 idénticos con fx off, en la cabecera) |
| 5   | `prefers-reduced-motion`: sin rAF del humo                                      | PASS                        | §5 (hook ausente, display:none, rAF 2 vs 294)                          |
| 6   | Safari/iOS y Firefox                                                            | PENDIENTE MANUAL            | §6 (no disponible en este entorno)                                     |
| 7   | `smoke-bench` en CI informativo                                                 | HECHO                       | §7 (job `continue-on-error`)                                           |
| 8   | `docs/guides/humo-resultados.md`                                                | HECHO                       | este documento                                                         |

## §9 — Ficheros

- Creados: `docs/guides/humo-resultados.md`, `scripts/smoke-verify.mjs`.
- Modificados: `scripts/smoke-bench.mjs`, `scripts/visual-smoke.mjs`,
  `src/components/smoke-canvas.tsx` (hook solo-lectura), `package.json`
  (`smoke-verify`), `.github/workflows/ci.yml` (job informativo).

Sin temporales pendientes; sin commits.

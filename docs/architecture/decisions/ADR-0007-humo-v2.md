# ADR-0007 — Humo v2: modelo puro determinista, capas L0–L4 y calidad adaptativa

### Propósito de este documento

- **Objetivos:** Registrar las decisiones del humo v2 (plan v2, fases S0–S8):
  modelo puro determinista sin DOM, capas L0–L4, híbrido «el humo se deshace
  en registro», elección sprite radial frente a `filter: blur`, cotas de
  contraste y calidad adaptativa con ahorro.
- **Estructura:** Estado → contexto → decisión → capas → modelo → elección
  técnica → contraste → consecuencias → alternativas.
- **Contenido a integrar según contexto:** Valores concretos en
  `src/styles.css` y en el código de `src/lib/smoke/model.ts` y
  `src/components/smoke-canvas.tsx`; medidas en
  `docs/guides/humo-baseline.md` (S0) y `docs/guides/humo-resultados.md` (S7).
  Sustituye en lo relativo al humo a la sección «Humo» de
  [ADR-0005](./ADR-0005-design-system-v2.md).

## Estado

Aceptado (2026-09-30)

## Contexto

ADR-0005 fijó un humo inicial (F5): Canvas 2D a media resolución, 14–28 orbes
bokeh, velocidad por fotograma (no por `dt`), opacidad ≤ 0,12 claro / 0,16
oscuro, pausa en pestaña oculta y fallback CSS `body::before`. La revisión
posterior (plan v2) identifica problemas verificables:

- **Movimiento imperceptible:** a 0,9–3,6 px/s el campo parece estático;
  además la integración por fotograma (no por `dt`) acopla la velocidad al
  frame rate.
- **Muros de glifos frente al texto:** resolver el humo a densidad plena en
  ASCII llena el ancho con `@`, compite con la tipografía del hero y no aporta
  información.
- **Aleatoriedad no reproducible:** sin semilla ni modelo puro, el humo no se
  puede probar con `node --test` ni acotar su alfa por contrato.
- **Coste no medido:** no había magnitud propia del humo; el bench medía solo
  el rAF de página, que no aísla el trabajo de `step`+`draw`.
- **Sin diseño adaptativo:** un único número de partículas por ancho no
  contempla CPU lenta, equipos de pocos hilos ni ahorro de datos.
- **Riesgo de contraste:** un fondo en movimiento continuo sobre texto exige
  una cota demostrable, no una estimación.

## Decisión

- **Modelo puro determinista sin DOM.** Todo el estado vive en
  `src/lib/smoke/model.ts`: `mulberry32(seed)` para las volutas ambientales,
  `vnoise` (value noise) para el flujo, `profile` (perfil radial del sprite),
  `spawn`/`createSmoke`/`stepSmoke` (curl 2D sin divergencia), `splat` a una
  rejilla de densidad, `softAlphaBound(s, k)` (cota `K · densidad_máx`),
  `ASCII_RAMP = [".", "·", ":", "~", "="]`, `ASCII_LOW 0.1`, `ASCII_HIGH 1.5`,
  `BAYER4`/`bayer`/`glyphFor` y `emit`. El componente
  `src/components/smoke-canvas.tsx` solo renderiza; `emit` no consume `s.rnd`,
  de modo que las volutas ambientales siguen siendo deterministas con o sin
  bocanadas de UI.
- **Humo suave sin glifos visibles.** El campo se pinta con un sprite irregular
  de varias lóbulos (no un disco radial) y `drawImage`. El modelo conserva
  `glyphFor` para pruebas; el canvas ASCII no se dibuja. No hay texto en el DOM:
  el `innerText` es idéntico con humo on/off.
- **Cinco capas L0–L4.** L0 `body::before` (degradados radiales estáticos,
  único fondo con JS desactivado, `prefers-reduced-motion`, `prefers-reduced-data`
  o fx=off); L1 humo suave; L2 ASCII tramado; L3 zonificación; L4 coreografía.
- **Calidad adaptativa y ahorro.** Tiers Q3 `{count:72, cell:16, ascii:true,
fps:30, res:0.5}`, Q2 `{count:40, cell:20, ascii:true, fps:24, res:0.4}`,
  Q1 `{count:24, cell:24, ascii:false, fps:20, res:0.33}`. Nivel inicial por
  ancho (`<768 → Q1`; `<1200 → Q2`; resto `Q3`) y
  `navigator.hardwareConcurrency ≤ 4 → Q2` como máximo. `Save-Data` o
  `prefers-reduced-data: reduce` → Q0 (solo L0, sin canvas ni rAF). La
  degradación usa la EMA del coste propio: baja de nivel solo si supera 24 ms
  **durante 2 s seguidos** y **nunca vuelve a subir en la sesión**. Pausa con
  `document.hidden` y reanudación sin salto.
- **Sprite radial sin `filter: blur`.** El humo suave usa un sprite radial
  pre-renderizado de 128 px y `drawImage` (sin blur de GPU por fotograma).
- **Cotización de contraste por contrato.** `src/data/contrast.test.ts` exige
  `K × densidad_máx ≤ --smoke-alpha` en Q3/Q2/Q1 con 11 semillas × 120 s, más
  el peor caso con solape ASCII (`--smoke-alpha + 0.12`).

## Capas

| Capa | Nombre         | Resolución                                       | Participa en                                  |
| ---- | -------------- | ------------------------------------------------ | --------------------------------------------- |
| L0   | `body::before` | Degradados radiales estáticos (CSS)              | SSR, JS off, reduced-motion, reduced-data, Q0 |
| L1   | Humo suave     | Canvas 2D a `res` del tier, sprite radial 128 px | Q1–Q3                                         |
| L2   | ASCII tramado  | Canvas a resolución de viewport, atlas de glifos | Q2–Q3                                         |
| L3   | Zonificación   | Máscaras horizontal (ASCII) y vertical (L1)      | —                                             |
| L4   | Coreografía    | Deriva por scroll (`translate3d`, ≤ 8 px)        | —                                             |

- **L3 — máscara horizontal ASCII:** `--content-half: 576px` (mitad de
  `max-w-6xl`, 72 rem) y solo ≥ 1024 px; el ASCII NUNCA entra en la columna de
  contenido. Máscara vertical L1 sobre `.smoke-soft`.
- **Ocultado** bajo `forced-colors: active`, `prefers-contrast: more`,
  `prefers-reduced-motion` y `prefers-reduced-data`.
- **Tema:** `--smoke-rgb` (claro `120 108 92` / `.dark` `200 196 188`),
  `--smoke-alpha` (claro `0.1` / oscuro `0.14`) y `--smoke-k` (claro `0.02` /
  oscuro `0.028`). Reglas `.smoke-layer`/`.smoke-soft`/`.smoke-ascii`.

## Modelo puro

- **Flujo:** `stepSmoke` mueve cada voluta con el curl 2D del value noise
  (`vnoise`) — campo sin divergencia que produce remolinos, no deriva uniforme.
- **Volutas (tras el ajuste S1, con K/alpha intactos):** `r` 26..56 px,
  `life` 11..17 s, `size = r·(1 + u·1.4)`, `vy` 26–52 px/s (8–15× el humo
  anterior). `spawn` recoloca al salir por arriba o agotar la vida.
- **Rejilla y cota:** cada voluta reparte `env · profile(d)` en la rejilla de
  densidad (`splat`); `softAlphaBound` devuelve `min(1, K · máxima densidad)`.
- **Bocanadas (`emit`):** hasta `EMIT_MAX = 3` simultáneas (FIFO), pico
  `EMIT_ENV = 0.16` y vida 1.5–2.2 s. `emit` usa `hash3(x, y, t)` en lugar de
  `s.rnd`, así que no altera el determinismo ambiental. `src/lib/smoke/emit-bus.ts`
  (`drainPuffs`, cola ≤ 3) conecta la UI con el modelo.

## Elección técnica: sprite radial frente a `filter: blur`

A/B en navegador: en escritorio `filter: blur` de 8/14 px es ruido (±0,15 ms
sobre el coste propio); en Safari y móvil el blur de GPU por fotograma
encarece el pintado y compite con el resto de la página. El sprite radial de
128 px ya es suave y se dibuja con `drawImage`, por lo que se adopta **sprite
radial sin `filter: blur`**.

## Cotas de contraste

- **Cota de alfa (S1):** margen ≥ 10 % en las tres rejillas (11 semillas ×
  120 s): Q3 densidad_máx 4.293 → margen 14.1 %; Q2 3.498 → 30.0 %; Q1 3.212
  → 35.8 % (`contrast.test.ts`).
- **Peor caso de lectura (S4),** `blendOver(fondo, humo, --smoke-alpha + 0.12)`
  (solape máximo de glifos ASCII, alfa ≤ 0.12), ratios fg/muted:
  - claro 12.490 / 7.280
  - oscuro 9.700 / **6.245** (peor caso global, ≥ 4.5 con margen 1.745)
  - prefers-contrast claro 15.265 / 10.952
  - prefers-contrast oscuro 11.223 / 8.843
- El ASCII vive solo en la banda baja y nunca dentro de la columna de
  contenido; sin texto en el DOM (`innerText` idéntico con humo on/off).

## Consecuencias

- La sección «Humo» de ADR-0005 queda **sustituida por este ADR**; los tokens
  `--smoke-rgb`/`--smoke-alpha` se conservan y se añade `--smoke-k`.
- El humo es ahora testeable sin navegador: `src/data/smoke-model.test.ts` (8
  tests) y la cota de `src/data/contrast.test.ts` corren en `pnpm test`.
- El hook solo-lectura `window.__vapelogSmoke {tier, emaMs, emits, densityMax,
emit, frameId, lastFrameCostMs}` y el atributo `data-smoke-tier` hacen el
  estado observable por los guardarraíles sin instrumentar el bucle.
- `scripts/smoke-bench.mjs` (coste propio) y `scripts/smoke-verify.mjs`
  (memoria, CLS/LCP, reduced-motion) añaden superficie de verificación; el job
  `smoke-bench` de CI es informativo (`continue-on-error: true`).
- La alternativa elegida añade dos canvas y un atlas por tier, y por tanto
  material que mantener (sprite + atlas + desvanecido de tema
  `THEME_FADE_MS = 400`). El fallback L0 garantiza que el sitio funciona sin
  ellos.

## Alternativas consideradas

- **A — Réplica del humo actual (bokeh):** descartada; sustituir el humo por
  una copia no resuelve movimiento, coste ni contraste.
- **B — Partículas v2 curl + sprites:** base adoptada; el modelo de flujo
  proviene de aquí.
- **C — ASCII a densidad plena:** DESCARTADA; produce muros de `@` que compiten
  con el texto.
- **D — Humo suave + ASCII sobre toda la densidad:** DESCARTADA; resultado
  saturado.
- **E — Híbrido «el humo se deshace en registro»:** ELEGIDA; núcleo denso en
  humo suave sin glifos y solo la banda de baja densidad en caracteres
  tramados con matriz de Bayer, con `=` reservado.
- **Canvas WebGL:** descartado por coste de GPU y batería; el sprite radial
  mantiene el efecto dentro del presupuesto (≤ 2 ms/frame, ≤ 4 ms CPU×4).

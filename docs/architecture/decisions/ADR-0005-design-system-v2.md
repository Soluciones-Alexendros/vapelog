# ADR-0005 — Sistema de diseño v2 y movimiento

### Propósito de este documento

- **Objetivos:** Registrar las decisiones del rediseño 2026 (fases F0–F8):
  tokens de superficie/estado/movimiento/humo, tipografía autoalojada,
  identidad vectorial, formato de contenidos y presupuestos de rendimiento.
- **Estructura:** Estado → contexto → decisión → resultado/implementación →
  consecuencias → alternativas.
- **Contenido a integrar según contexto:** Valores concretos en
  `src/styles.css`; línea base de comparación en
  `docs/guides/baseline-2026-09.md`. Diagnóstico completo (D1–D17) en el
  documento de planificación de la sesión; aquí se resume solo lo trazable.

## Estado

Aceptado (2026-09-29)

## Contexto

El diagnóstico previo al rediseño (D1–D17, verificado en parte contra el
código actual) agrupa los problemas en seis áreas:

- **Tokens (D1, D12, D15):** faltan los keyframes `accordion-down/up` que los
  componentes Radix esperan; `--border` e `--input` son el mismo valor (el
  borde sutil no puede distinguirse del borde de control); y en `@theme inline`
  `--radius: var(--radius)` es autorreferente, con lo que el token no fluye a
  las utilidades.
- **Tipografía y carga (D7):** Fraunces/Public Sans se sirven desde Google
  Fonts vía `<link>`, un tercero en la ruta crítica con coste de red y
  privacidad; además se precargan varias familias cuando solo el cuerpo lo
  necesita.
- **Identidad (D3):** no hay `site.webmanifest` ni iconos PNG (`favicon.ico`,
  apple-touch, 192/512); el favicon SVG no adapta su fondo al tema oscuro.
- **Rendimiento (D8, D14):** `public/catalog` pesa ~18 MB sin formatos
  modernos ni `srcset`; el catálogo completo viaja al cliente en
  `labels-*.js` (~44 KB gzip de datos); las imágenes sin dimensiones
  reservadas provocan CLS.
- **SEO y contenido (D5, D6, D16):** el `<head>` es único para todo el sitio;
  faltan `robots.txt` y sitemap; la home no refleja novedades del archivo.
- **UX y accesibilidad (D4, D9, D10, D11, D13):** `theme-color` es estático;
  la cabecera ocupa tres filas; el hover/focus de la navegación secundaria y
  el pie es inoperante; las fichas de compatibilidad son un muro de texto; no
  hay placeholders por familia.

La línea base F0 (`docs/guides/baseline-2026-09.md`) fija el punto de partida:
37 chunks JS (947 KB en bruto, 235 KB gzip), HTML de ficha XROS 4 de 242 KB,
cargas de ~225–293 ms en loopback local y 30 capturas claro/oscuro ×
360/768/1280 px sin desbordamiento ni errores de consola.

## Decisión

- **Tokens de superficie y estado:** escala `--surface-1/2/3` y sombras
  `--shadow-1/2/3` con tinte cálido; separar `--border` (sutil) de
  `--border-strong` (borde de control, ≥ 3:1) y migrar `--input` a
  `--border-strong`; corregir la autorreferencia `--radius`; tokens de estado
  `--success/--warning/--info` con sus `-foreground`. Los tests de
  `src/data/contrast.test.ts` se activan automáticamente al aparecer los
  tokens y exigen el contrato completo (texto ≥ 4,5:1, bordes ≥ 3:1, en
  claro, oscuro y `prefers-contrast`).
- **Movimiento:** tokens `--ease-out/--ease-in-out` y `--dur-1..4`;
  `prefers-reduced-motion` los reduce a ~0; keyframes `accordion-down/up`
  registrados como `--animate-accordion-down/up` en `@theme inline`; solo
  `transform`/`opacity` animables; conmutador global "Efectos" persistido en
  `vapelog-fx` (por defecto respeta `prefers-reduced-motion`, WCAG 2.2.2).
- **Humo:** tokens `--smoke-rgb/--smoke-alpha` (claro/oscuro) con fallback
  `body::before` de degradados radiales (base SSR y reduced-motion) y capa
  Canvas 2D a media resolución (0,5) con 14–28 partículas a ≤ 30 fps, pausa
  en pestaña oculta y opacidad ≤ 0,12 claro / 0,16 oscuro.
  **Sustituido por [ADR-0007](./ADR-0007-humo-v2.md).**
- **Tipografía autoalojada:** `@fontsource-variable/fraunces` y
  `@fontsource-variable/public-sans` con `font-display: swap`; se eliminan los
  enlaces a Google Fonts de `__root.tsx` y se precarga solo la fuente de
  cuerpo; escala fluida `clamp()` para titulares y `tabular-nums` en datos.
- **Tema en tres estados:** Claro/Oscuro/Sistema con `vapelog-theme` ∈
  `light|dark|system`, listener `matchMedia` en modo sistema y `theme-color`
  servido con dos `<meta media>` sincronizados.
- **Identidad "V con voluta":** marca vectorial (`logo-mark.svg`, `logo.svg`,
  `logo-mono.svg` en `currentColor`), favicon con `@media
(prefers-color-scheme: dark)` interno, iconos PNG generados con sharp y
  `site.webmanifest`; decisión de la variante (recta/S/doble) por legibilidad
  a 16/32/64 px.
- **Formato de contenidos estilo kimovil:** fichas con hero foto+specs, índice
  de anclajes con scrollspy, especificaciones en acordeón agrupado,
  compatibilidad completa sin muro (encaja/no encaja con miniaturas),
  comparador con mejor valor por fila y listados con tarjetas, filtros y
  placeholders por familia. Sin puntuaciones ni precios: Vapelog es catálogo
  de referencia, no tienda; los datos no publicados quedan "Sin dato
  publicado".
- **SEO por ruta:** `head()` por ruta y ficha (título, description, canonical,
  OG), JSON-LD `Product` sin ofertas ni valoraciones, `BreadcrumbList`,
  `robots.txt` y sitemap generado en build desde el catálogo.
- **Presupuestos de rendimiento:** LCP ≤ 2,5 s · CLS ≤ 0,05 · INP ≤ 200 ms ·
  JS inicial ≤ 200 KB gzip por ruta · HTML ficha XROS 4 ≤ 150 KB ·
  `public/catalog` ≤ 4 MB · humo ≤ 2 ms/frame (≤ 4 ms CPU×4 en trazas).
- **Guardarraíles:** `scripts/visual-smoke.mjs` (sin desbordamiento horizontal
  ni errores de consola en 5 rutas × 2 temas × 3 anchos), ampliación de
  `scripts/a11y-pass.mjs` con `@axe-core/playwright` (0 violaciones
  serias/críticas) y cobertura ≥ 70 % en `src/data/` + `scripts/`.

### Valores concretos fijados en F1

Todos en `src/styles.css`, en OKLCH salvo `--smoke-rgb` (triplete sRGB para
canvas) y las sombras (OKLCH con alfa). Claro = `:root`, oscuro = `.dark`.

| Token                            | Claro                                                     | Oscuro                           |
| -------------------------------- | --------------------------------------------------------- | -------------------------------- |
| `--border` (hairline decorativo) | `oklch(0.88 0.015 80)`                                    | `oklch(0.30 0.015 80)`           |
| `--border-strong` / `--input`    | `oklch(0.62 0.03 75)`                                     | `oklch(0.58 0.03 75)`            |
| `--surface-1` (fondo)            | `oklch(0.985 0.006 85)`                                   | `oklch(0.16 0.012 80)`           |
| `--surface-2` (tarjeta)          | `oklch(0.995 0.004 85)`                                   | `oklch(0.22 0.014 80)`           |
| `--surface-3` (elevada, humo)    | `oklch(0.998 0.004 72)`                                   | `oklch(0.27 0.012 72)`           |
| `--success` / `-foreground`      | `0.5 0.12 155` / `0.99 0.01 95`                           | `0.72 0.14 155` / `0.2 0.03 150` |
| `--warning` / `-foreground`      | `0.55 0.12 75` / `0.99 0.01 95`                           | `0.78 0.13 80` / `0.25 0.04 75`  |
| `--info` / `-foreground`         | `0.5 0.11 245` / `0.99 0.01 95`                           | `0.72 0.11 245` / `0.2 0.03 245` |
| `--smoke-rgb` / `--smoke-alpha`  | `120 108 92` / `0.1`                                      | `200 196 188` / `0.14`           |
| `--ease-out` / `--ease-in-out`   | `cubic-bezier(.22,1,.36,1)` / `cubic-bezier(.65,0,.35,1)` | (igual)                          |
| `--dur-1…--dur-4`                | `120 / 200 / 400 / 700 ms`                                | (igual)                          |

Decisiones técnicas asociadas:

- **`--border` queda fuera del contraste ≥ 3:1.** El test
  `src/data/contrast.test.ts` exige ≥ 3:1 a `--border-strong`, `--input` y
  `--ring` sobre el fondo; `--border` es el hairline por defecto de
  `* { border-color }` y no tiene requisito WCAG 1.4.11.
- **Radios con patrón `calc`:** `--radius` (0,375 rem) es la única base en
  `:root`; `@theme inline` deriva `--radius-sm/md/lg/xl` con `calc`, sin la
  autorreferencia `--radius: var(--radius)` (D15).
- **Duraciones como `@utility`:** Tailwind v4 resuelve `duration-<número>`
  como valor literal (número → ms) e ignora las claves `--duration-<número>`
  del tema; por eso `duration-1…4` se definen como utilidades personalizadas
  que referencian `var(--dur-1…4)` (precedencia de `@utility` sobre la
  utilidad integrada, garantizada por Tailwind).
- **Movimiento reducido:** `prefers-reduced-motion: reduce` lleva
  `--dur-*` a `0.01ms` y las curvas a `linear` (bloque sin capa, tras
  `@layer base`, para ganar al `:root` plano); además se conserva el
  `animation/transition-duration: 0.01ms !important` global.
- **Bloques `prefers-contrast: more` y `forced-colors` fuera de `@layer
base`:** el `:root` plano sin capa tiene mayor prioridad que cualquier
  regla en capa; si estos overrides vivieran dentro de `@layer base` quedaría
  anulados por los tokens base. Incluyen las superficies y `--border-strong`.
- **Fuentes autoalojadas:** `@fontsource-variable/public-sans` (eje `wght`)
  y `@fontsource-variable/fraunces` (archivo `standard.css`, ejes `opsz,wght`)
  se importan en `src/styles.css`; `--font-sans` = "Public Sans Variable" y
  `--font-display` = "Fraunces Variable" (`font-display: swap` ya incluido).
  Sin preload de woff2: la URL del bundle lleva hash de Vite y no es
  estable; se acepta el intercambio (etiqueta `theme-color` y swap mitigan).
- **Humo estático:** `body::before` con dos `radial-gradient` en
  `rgb(var(--smoke-rgb) / .10/.08)`, `fixed inset-0 z-index:-11`, sirve de
  fondo SSR y de reduced-motion hasta la capa Canvas de F5.

## Resultado e implementación

El rediseño se ejecutó completo (F0–F8) en la rama `feat/rediseno-2026` y se
cerró el 2026-09-29. Entregado por fase:

- **F0 — Línea base:** medidas previas registradas en
  `docs/guides/baseline-2026-09.md`.
- **F1 — Tokens y tipografía:** superficies `--surface-1/2/3`, sombras
  `--shadow-1/2/3`, `--border` (hairline) separado de
  `--border-strong`/`--input` (≥ 3:1), estados `--success/--warning/--info` +
  `-foreground`, movimiento `--ease-out/--ease-in-out` + `--dur-1..4` y
  keyframes de acordeón; tokens de humo `--smoke-rgb/--smoke-alpha`.
  Tipografía autoalojada con `@fontsource-variable/fraunces` y
  `@fontsource-variable/public-sans` (`font-display: swap`); Google Fonts
  eliminado de `__root.tsx`.
- **F2 — Identidad:** «V con voluta» en
  `public/{logo-mark,logo,logo-mono}.svg` (`currentColor`), `favicon.svg` con
  `@media (prefers-color-scheme)`, PNGs (favicon-32, apple-touch-icon,
  icon-192, icon-512), `site.webmanifest` y generador
  `scripts/build-icons.mjs` (`pnpm run icons`).
- **F3 — Contenidos:** hero `#resumen` foto+specs, índice de anclas con
  scrollspy (`IntersectionObserver` + `aria-current`), especificaciones en
  acordeón, compatibilidad encaja/no-encaja con miniaturas (grupo «No encaja»
  plegado, fuera del SSR), comparador con mejor-valor-por-fila (solo claves
  numéricas objetivas con ≥ 2 valores publicados), listados con tarjetas fijas
  y `CardMedia` con placeholder por familia («Sin foto»), home con
  «Novedades» (2 posts reales) y «Una ficha por dominio».
- **F4 — SEO:** `head()` por ruta (`src/lib/seo.ts` `buildHead`), JSON-LD
  `Product` sin `offers` + `BreadcrumbList` en fichas (blog solo breadcrumb),
  `public/robots.txt` (Disallow /buscar) y sitemap generado por
  `scripts/build-sitemap.mjs` (`pnpm run sitemap`).
- **F5 — Humo:** `src/components/smoke-canvas.tsx` (Canvas 2D, 14–28 partículas
  según ancho, ≤ 30 fps, pausa en pestaña oculta, respeta
  `prefers-reduced-motion`) con store `src/lib/fx.ts` (`vapelog-fx` on|off) y
  botón «Efectos» en el theme-toggle; fallback CSS `body::before` conservado.
- **F6 — Imágenes:** fuentes en `assets/catalog/` (94, tracked); variantes en
  `public/catalog/` (240: 146 webp + 94 avif) por `scripts/build-images.mjs`
  (`pnpm run images`); manifiesto `src/data/images.gen.ts` +
  `productImage`/`productImageSource` en `src/data/images.ts`; `photo.tsx` con
  `<picture>`, `srcset`, `sizes` y `width/height` (anti-CLS).
- **F7 — a11y/UX:** `scripts/a11y-pass.mjs` con `@axe-core/playwright`
  (`pnpm run a11y`); cabecera a 1 fila (nav con scroll horizontal), logo real y
  hover/focus corregidos.
- **F8 — Cierre:** regeneración de la línea base y comparación antes/después en
  `docs/guides/baseline-2026-09.md`.

### Medidas después del rediseño (2026-09-29)

| Métrica             | Antes (F0)                             | Después                                                                                                       |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| JS cliente          | 37 chunks · 947 KB bruto · 235 KB gzip | 36 ficheros · 993 KB bruto · 248 KB gzip                                                                      |
| HTML ficha XROS 4   | 242 KB                                 | 67,8 KB                                                                                                       |
| `public/catalog`    | 18 MB                                  | 2,45 MB                                                                                                       |
| Cobertura de líneas | —                                      | 97,69 % (ramas 82,99 %, funciones 84,93 %)                                                                    |
| Guardarraíles       | —                                      | visual-smoke 30 comb. / 0 fallos · a11y 10 comb. / 0 violaciones · smoke 9 rutas 200 + 404 · sitemap 462 URLs |

HTML servido después: `/` 25,2 KB · `/dispositivos/geekvape-aegis-legend-2`
106,3 KB (máximo) · `/resistencias` 210,6 KB · `/compatibilidad` 28,8 KB ·
`/comparar` 13,4 KB. Se cumplen los presupuestos fijados (JS por ruta,
HTML ≤ 150 KB, `public/catalog` ≤ 4 MB, cobertura ≥ 70 %).

## Consecuencias

- ADR-0002 queda reemplazado parcialmente: la estrategia de clase `.dark` y
  los tokens semánticos shadcn se mantienen; cambian los valores, la escala
  de superficies/estados y la fuente de las tipografías.
- Nuevas dependencias, aprobadas en el plan de rediseño y justificadas aquí:
  `@fontsource-variable/fraunces`, `@fontsource-variable/public-sans`,
  `sharp`, `@axe-core/playwright`, `@tanstack/react-virtual` y
  `vite-bundle-visualizer`.
- Añadir un token nuevo sin su pareja o sin contraste suficiente rompe
  `pnpm test` de inmediato: el contrato es verde desde F1, no opcional.
- La comparación antes/después del rediseño se hará contra
  `docs/guides/baseline-2026-09.md` y sus capturas en `docs/guides/baseline/`.
- El humo y las animaciones añaden superficie de código a mantener y un
  conmutador más de preferencias; el fallback CSS garantiza que el sitio
  completo funciona sin ellos.

## Alternativas consideradas

- **Mantener Google Fonts:** se descarta por tercero en la ruta crítica,
  coste de red medible y dependencia de privacidad; el paquete autoalojado
  cuesta ~2 dependencias y build determinista.
- **Tema solo claro/oscuro manual:** se descarta porque no respeta la
  preferencia del sistema sin paso del usuario en cada dispositivo.
- **Catálogo completo en el cliente (estado actual):** se mantiene en F1 y se
  reevalúa en F6 con `vite-bundle-visualizer`; si el presupuesto de 200 KB
  gzip inicial se incumple, se carga por ruta/SSR. Decisión diferida con dato.
- **Canvas WebGL para el humo:** se descarta por coste de GPU y batería; el
  Canvas 2D a media resolución con sprite pre-renderizado alcanza el efecto
  dentro del presupuesto de 2 ms/frame.
- **Puntuaciones y precios tipo kimovil:** se descartan por el modelo de
  producto (catálogo de referencia, no tienda): exigirían datos que las
  fuentes no publican y contradirían la regla de "Sin dato publicado".

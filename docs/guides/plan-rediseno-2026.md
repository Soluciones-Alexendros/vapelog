# Plan — Rediseño 2026 de Vapelog

### Propósito de este documento

- **Objetivos:** Canonizar el plan del rediseño 2026 (rama
  `feat/rediseno-2026`) que arrancó el diagnóstico D1–D17 y la fase F0, fijar el
  mapa de fases F0–F8, los criterios de aceptación y los guardarraíles, para que
  el trabajo sobreviva a cambios de sesión o de agente.
- **Estructura:** Contexto → diagnóstico → mapa de fases → presupuestos →
  orquestación y gates → Definition of Done.
- **Contenido a integrar según contexto:** Este documento es la fuente de
  verdad operativa del rediseño. Si difiere del código, gana el código: se
  actualiza el plan. No reintroducir auth, multiplayer ni broker sin ADR.

## 1. Contexto

Vapelog es un catálogo de referencia para adultos (UE/España): no es tienda ni
vende nicotina. Dominios: dispositivos, resistencias (coils), líquidos y
componentes. Marca visible única: **Vapelog**. La compatibilidad eléctrica,
nativa y de kit, junto con las calculadoras de nicokit, viven en
`src/data/logic.ts` y en las rutas `/compatibilidad` y `/herramientas`.

El rediseño 2026 se decide en
[ADR-0005](../architecture/decisions/ADR-0005-design-system-v2.md), que agrupa
el diagnóstico D1–D17 y fija las decisiones del sistema de diseño v2. La línea
base cuantitativa previa está en [baseline-2026-09.md](./baseline-2026-09.md)
(fase F0). Este plan es el mapa de ejecución de todas las fases.

## 2. Diagnóstico D1–D17 (reconstruido)

El documento de diagnóstico original solo se conserva resumido en ADR-0005. Se
reconstruye aquí agrupado por área:

| Área             | IDs                   | Hallazgo                                                                                                                                                                       |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tokens           | D1, D12, D15          | Faltan keyframes `accordion-down/up`; `--border` == `--input`; `--radius: var(--radius)` autorreferente en `@theme inline`.                                                    |
| Tipografía/carga | D7                    | Fraunces y Public Sans se sirven desde Google Fonts vía `<link>` (tercero en ruta crítica); se precargan varias familias.                                                      |
| Identidad        | D3                    | Sin `site.webmanifest` ni PNGs (favicon/apple-touch/192/512); el favicon SVG no adapta el fondo al tema oscuro.                                                                |
| Rendimiento      | D8, D14               | `public/catalog` ~18 MB sin formatos modernos ni `srcset`; el catálogo completo viaja al cliente en `labels-*.js` (~44 KB gzip); imágenes sin dimensiones → CLS.               |
| SEO/contenido    | D5, D6, D16           | `<head>` único; faltan `robots.txt` y `sitemap`; la home no refleja novedades.                                                                                                 |
| UX/a11y          | D4, D9, D10, D11, D13 | `theme-color` estático; cabecera a 3 filas; hover/focus de la nav secundaria y del pie inoperantes; fichas de compatibilidad como muro de texto; sin placeholders por familia. |

## 3. Mapa de fases F0–F8

### F0 — Línea base ✅ completa

Captura cuantitativa previa al rediseño (assets, HTML por ruta, tiempos y 30
capturas) en [baseline-2026-09.md](./baseline-2026-09.md). Método reproducible:
`pnpm run build` + `node .output/server/index.mjs` + Playwright.

### F1 — Tokens y tipografía ✅ completada

- **Superficies:** `--surface-1/2/3` y sombras `--shadow-1/2/3`.
- **Bordes:** `--border` (hairline, sin requisito WCAG) separado de
  `--border-strong`/`--input` (≥ 3:1).
- **Estados:** `--success`/`--warning`/`--info` + `-foreground`.
- **Movimiento:** `--ease-out`/`--ease-in-out` y `--dur-1..4`
  (120/200/400/700 ms), con `prefers-reduced-motion: reduce` → 0.01 ms linear.
- **Keyframes:** `--animate-accordion-down/up` registrados.
- **Humo (tokens):** `--smoke-rgb` (120 108 92 claro / 200 196 188 oscuro) y
  `--smoke-alpha` (0.1 / 0.14), con fallback `body::before` (radial gradients).
- **Tipografía autoalojada:** `@fontsource-variable/fraunces` y
  `@fontsource-variable/public-sans` (`font-display: swap`); Google Fonts
  eliminado de `src/routes/__root.tsx`.
- **Tema 3 estados:** Claro/Oscuro/Sistema con `vapelog-theme` ∈
  `light|dark|system`, listener de `matchMedia` y dos metas `theme-color` con
  `media`.
- **Guardarraíl:** `src/data/contrast.test.ts` parsea `src/styles.css` y exige
  texto ≥ 4.5:1 y acentos/bordes ≥ 3:1 en claro, oscuro y `prefers-contrast`.
- **Verificación:** typecheck ✅ · lint (0 errores, 31 warnings de fast-refresh)
  · test 142/142 ✅ · build ✅ (243 ms) · smoke HTTP ✅ · visual-smoke ✅ (30
  combinaciones, 0 fallos).

### F2 — Identidad ✅ completada

- Entregado: `public/{logo-mark,logo,logo-mono}.svg` (monocromo en
  `currentColor`, motivo «V con voluta»), `public/favicon.svg` con
  `@media (prefers-color-scheme)`, PNGs (favicon-32, apple-touch-icon,
  icon-192, icon-512) + `site.webmanifest`, generados por
  `scripts/build-icons.mjs` (`pnpm run icons`).
- **Evidencia:** `pnpm run icons` reproducible; build + smoke OK.

### F3 — Contenidos (formato kimovil) ✅ completada

- Entregado: hero `#resumen` (foto + specs), índice de anclas con scrollspy
  (`IntersectionObserver` + `aria-current`), especificaciones en acordeón,
  compatibilidad encaja/no-encaja con miniaturas (grupo «No encaja» plegado →
  no viaja en SSR), comparador con mejor-valor-por-fila (solo claves numéricas
  objetivas con ≥ 2 valores publicados), listados con tarjetas fijas + `CardMedia`
  con placeholder por familia («Sin foto»), home con «Novedades» (2 posts
  reales) y «Una ficha por dominio».
- **Evidencia:** HTML ficha XROS 4 **67,8 KB** (presupuesto ≤ 150 KB; antes
  242 KB); máximo `/dispositivos/geekvape-aegis-legend-2` 106,3 KB; smoke OK.

### F4 — SEO y metadatos ✅ completada

- Entregado: `head()` por ruta (`src/lib/seo.ts` `buildHead`), JSON-LD
  `Product` sin `offers` + `BreadcrumbList` en fichas (blog solo breadcrumb),
  `public/robots.txt` (Disallow /buscar) y sitemap generado por
  `scripts/build-sitemap.mjs` (`pnpm run sitemap`).
- **Evidencia:** sitemap con 462 URLs; smoke 9 rutas 200 + 404 real.

### F5 — Humo (Canvas 2D) ✅ completada

- Entregado: `src/components/smoke-canvas.tsx` (14–28 partículas según ancho,
  ≤ 30 fps, pausa en pestaña oculta, respeta `prefers-reduced-motion`), store
  `src/lib/fx.ts` (`vapelog-fx` on|off) con botón «Efectos» en el theme-toggle;
  fallback CSS `body::before` conservado.
- **Evidencia:** visual-smoke 30 combinaciones / 0 fallos.

### F6 — Rendimiento de imágenes ✅ completada

- Entregado: fuentes originales en `assets/catalog/` (94, tracked);
  variantes generadas en `public/catalog/` (240: 146 webp + 94 avif) por
  `scripts/build-images.mjs` (`pnpm run images`); manifiesto
  `src/data/images.gen.ts` + `productImage`/`productImageSource` en
  `src/data/images.ts`; `photo.tsx` con `<picture>`, `srcset`, `sizes` y
  `width/height` (anti-CLS).
- **Evidencia:** `public/catalog` **2,45 MB** (presupuesto ≤ 4 MB; antes 18 MB).

### F7 — a11y y UX ✅ completada

- Entregado: `scripts/a11y-pass.mjs` con `@axe-core/playwright`
  (`pnpm run a11y`): 0 violaciones serias o críticas; cabecera a 1 fila (nav con
  scroll horizontal), logo real y hover/focus corregidos.
- **Evidencia:** a11y-pass 10 combinaciones axe / 0 violaciones serias/críticas.

### F8 — Cierre ✅ completada

- Entregado: línea base regenerada y comparación antes/después en
  [baseline-2026-09.md](./baseline-2026-09.md); ADR-0005 a estado «Aceptado».
- **Evidencia:** cobertura `pnpm run test:coverage` all files 97,69 % líneas /
  82,99 % ramas / 84,93 % funciones (gate CI ≥ 70 %); guardarraíles en verde.

### Layout de imágenes (F6)

```
assets/catalog/   imágenes fuente originales (tracked, no se sirven)
public/catalog/   variantes webp/avif generadas (regenerar con `pnpm run images`)
```

## 4. Presupuestos de rendimiento

| Métrica             | Presupuesto   |
| ------------------- | ------------- |
| LCP                 | ≤ 2.5 s       |
| CLS                 | ≤ 0.05        |
| INP                 | ≤ 200 ms      |
| JS por ruta         | ≤ 200 KB gzip |
| HTML ficha XROS 4   | ≤ 150 KB      |
| `public/catalog`    | ≤ 4 MB        |
| Coste del humo      | ≤ 2 ms/frame  |
| Cobertura de líneas | ≥ 70 %        |

## 5. Orquestación y gates

- **Tarea 0 (bloqueante):** retirar `plan-unificacion-alignux.md` (archivo ajeno
  al proyecto), verificar F1 (build + smoke + visual-smoke) y publicar este
  plan. ✅
- **Ola 1 (paralela, artefactos, sin solape):** ejecutada — F2 (logos +
  `build-icons.mjs` + webmanifest), F4 (`build-sitemap.mjs` + `robots.txt` +
  helper SEO), F5 (`smoke-canvas` + lib de efectos) y F6 (`build-images.mjs` +
  catálogo optimizado + manifiesto), en ficheros disjuntos.
- **Ola 2 (integración por propiedad de fichero):** ejecutada —
  `src/routes/__root.tsx`, rutas y componentes compartidos: enlazar manifiesto y
  sitemap, montar el humo, `head()` por ruta y `srcset` en las fichas, y las
  mejoras de contenido de F3. Cada fichero compartido tuvo un solo dueño para
  evitar solapes.
- **Corrección de imágenes:** ejecutada — regeneración de variantes webp/avif
  (`pnpm run images`) y ajuste de `photo.tsx`/manifiesto tras la integración.
- **Ola 3:** ejecutada — F7 (a11y/UX) y F8 (cierre y comparación de línea base).
- **Gate por fase:** `pnpm run typecheck` + `pnpm run lint` + `pnpm test`; y
  `pnpm run build` + `pnpm run smoke` cuando la fase toque rutas o el shell.
- **Entrega:** un único commit al final, previa verificación completa del
  Definition of Done.

## 6. Definition of Done

- Typecheck, lint y tests verdes.
- Cobertura de líneas ≥ 70 % en `src/data/` + `scripts/` (job `test` de CI).
- Build + smoke OK si se tocan rutas o el shell.
- Docs y ADR actualizados si cambia la arquitectura o los contratos.

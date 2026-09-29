# Guía — Línea base de rendimiento y visual (septiembre 2026)

### Propósito de este documento

- **Objetivos:** Fijar la línea base previa al rediseño 2026 (rama
  `feat/rediseno-2026`, fase F0) para poder comparar antes/después en la fase
  F8 y detectar regresiones de peso, tiempos y composición visual.
- **Estructura:** Entorno → assets → HTML por ruta → tiempos → capturas.
- **Contenido a integrar según contexto:** Métricas capturadas el 2026-09-29
  contra el build de producción local. No rehacer a mano: regenerar con el
  mismo método (build + `node .output/server/index.mjs` + Playwright).

## Entorno de captura

- Build: `pnpm run build` (Vite 8 + Nitro, 417 ms) servido con
  `node .output/server/index.mjs` en `127.0.0.1:4173`.
- Playwright (Chromium headless, `--no-sandbox`), contexto nuevo por captura
  (sin caché), puerta de edad saltada con
  `sessionStorage.setItem("vapelog-edad", "ok")` vía `addInitScript`.
- Tema oscuro emulado con `prefers-color-scheme: dark` (sin tocar
  `localStorage`; el `themeBootScript` lee `matchMedia`).
- La medición es de loopback local: no incluye red, TLS ni CDN. Sirve para
  comparar entre fases del rediseño, no como dato de campo.

## Assets JS/CSS (`.output/public/assets`)

37 chunks JS: **947 KB en bruto · 235 KB gzip** (gzip -9). Chunks principales:

| Chunk                               |  Bruto |   Gzip |
| ----------------------------------- | -----: | -----: |
| `labels-oYuXmkLV.js` (catálogo)     | 358 KB |  44 KB |
| `index-G2nHkpBA.js` (React + shell) | 349 KB | 109 KB |
| `archivo-DSrElzDu.js`               |  54 KB |  14 KB |
| `table-B0eqToSr.js`                 |  47 KB |  16 KB |
| `sheets-DDZNDjuR.js`                |  32 KB |  10 KB |
| `cn-CVVirXNs.js`                    |  31 KB |  10 KB |
| `link-BRp2V09C.js`                  |  19 KB |   8 KB |
| `specs-DMsBX4pe.js`                 |  14 KB |   4 KB |
| `styles-egX4bgqW.css`               |  26 KB |   6 KB |

Observaciones: el catálogo completo viaja al cliente en `labels-*.js`
(diagnóstico D14 del rediseño). Las fuentes (Fraunces/Public Sans) se sirven
desde Google Fonts vía `<link>` en `src/routes/__root.tsx` (D7): no pesan en el
build pero añaden peticiones externas en serie con el CSS.

## Imágenes del catálogo

`public/catalog`: **18 MB** (94 ficheros). Objetivo F6: ≤ 4 MB con WebP/AVIF.

## HTML servido (curl, body en bytes)

| Ruta                             |   Bytes |
| -------------------------------- | ------: |
| `/`                              |  16 406 |
| `/dispositivos`                  |  69 809 |
| `/dispositivos/vaporesso-xros-4` | 241 899 |
| `/resistencias`                  | 160 143 |
| `/comparar`                      |  10 046 |

La ficha XROS 4 ya roza el presupuesto F3 de 150 KB de HTML (aquí 242 KB,
incluye listados de compatibilidad en SSR).

## Tiempos de carga (Playwright, media de 6 capturas por ruta)

| Ruta                             | `load` medio | `DOMContentLoaded` medio |
| -------------------------------- | -----------: | -----------------------: |
| `/`                              |       231 ms |                   136 ms |
| `/dispositivos`                  |       247 ms |                   165 ms |
| `/dispositivos/vaporesso-xros-4` |       293 ms |                   163 ms |
| `/resistencias`                  |       240 ms |                   150 ms |
| `/comparar`                      |       225 ms |                   134 ms |

Sin desbordamiento horizontal ni errores de consola en ninguna de las 30
capturas.

## Capturas

30 PNG en `docs/guides/baseline/` (≈ 25 MB en total, páginas completas):
`{ruta}-{claro|oscuro}-{360|768|1280}.png` con
`ruta ∈ {home, dispositivos, ficha, resistencias, comparar}`. Las fichas a
1280 px superan los 2 MB por PNG por la lista de compatibilidad en SSR.

## Después del rediseño (2026-09-29)

Medidas posteriores (fase F8) capturadas contra el build de producción local con
el mismo método que la línea base F0. Cierran la comparación del rediseño
2026 documentado en
[ADR-0005](../architecture/decisions/ADR-0005-design-system-v2.md) y en el
[plan de rediseño](./plan-rediseno-2026.md).

### Comparación antes/después

| Métrica             | Antes (F0)                             | Después (2026-09-29)                                                                                          |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| JS cliente          | 37 chunks · 947 KB bruto · 235 KB gzip | 36 ficheros · 993 KB bruto · 248 KB gzip                                                                      |
| HTML ficha XROS 4   | 242 KB                                 | 67,8 KB                                                                                                       |
| `public/catalog`    | 18 MB (94 ficheros)                    | 2,45 MB (240 variantes: 146 webp + 94 avif)                                                                   |
| Cobertura de líneas | —                                      | 97,69 % (ramas 82,99 %, funciones 84,93 %)                                                                    |
| Guardarraíles       | —                                      | visual-smoke 30 comb. / 0 fallos · a11y 10 comb. / 0 violaciones · smoke 9 rutas 200 + 404 · sitemap 462 URLs |

### HTML servido después (curl, body en bytes)

| Ruta                                    |   Bytes |
| --------------------------------------- | ------: |
| `/`                                     |  25 200 |
| `/dispositivos/geekvape-aegis-legend-2` | 106 300 |
| `/dispositivos/vaporesso-xros-4`        |  67 800 |
| `/resistencias`                         | 210 600 |
| `/compatibilidad`                       |  28 800 |
| `/comparar`                             |  13 400 |

La ficha XROS 4 pasa de 242 KB a 67,8 KB (≤ 150 KB de presupuesto) y el máximo
del sitio baja a `/dispositivos/geekvape-aegis-legend-2` con 106,3 KB. El JS
crece ligeramente en bytes (36 ficheros, 993 KB brutos / 248 KB gzip) por el
sistema de diseño, las fuentes y el humo, dentro del presupuesto por ruta.

## Cómo regenerar

```bash
pnpm run build
PORT=4173 HOST=127.0.0.1 NITRO_HOST=127.0.0.1 NITRO_PORT=4173 \
  node .output/server/index.mjs &
# script de captura: 5 rutas × 2 temas × 3 anchos, fullPage, timings de navegación
```

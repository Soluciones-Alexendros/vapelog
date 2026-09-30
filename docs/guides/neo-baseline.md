# Línea base neo-brutalista (fase N0)

### Propósito de este documento

- **Objetivos:** Fijar la línea base de producción y rendimiento antes del
  rediseño neo-brutalista: commit/rama, versión, medida `smoke-bench`,
  capturas claro/oscuro, discrepancias P1–P4 conocidas y checklist de Vercel
  para el humano.
- **Estructura:** Estado → medida de humo → capturas → discrepancias →
  checklist Vercel.
- **Contenido a integrar según contexto:** Traza en el plan maestro
  `vapelog-plan-v3-neobrutalista.md` (§1 auditoría P1–P4, §5 fase N0).
  El cierre comparativo antes/después vive en `docs/guides/neo-resultados.md`
  (fase N8).

## Estado

- **Rama:** `feat/neo-brutalista` (activa, sin commit ni push por contrato).
- **HEAD:** `7f98bd7` feat(humo): fondo de humo v2 y cierre de deuda
  F2/F3/F4/F6/F7 (#8).
- **Versión:** `0.8.0` en el árbol de trabajo; `HEAD` aún registra `0.7.0`
  (el bump a 0.8.0 está sin commitear, lo gestiona otra oleada; no se toca
  `package.json` en N0).
- **Dominio canónico (decisión cerrada):**
  `https://vapelog-alexendros.vercel.app`. Alineados en N0: `src/lib/seo.ts`
  (`DEFAULT_SITE_BASE`), `public/sitemap.xml` (todas las `<loc>`) y
  `public/robots.txt` (línea `Sitemap:`). `src/lib/site.ts` ya era correcto
  (no tocado). `VITE_SITE_URL` se mantiene como override.
- **Nota:** `scripts/build-sitemap.mjs:14` conserva
  `DEFAULT_SITE_BASE = "https://vapelog.es"`; regenerar con
  `SITE_URL`/`VITE_SITE_URL` apuntando al canónico o actualizar el default en
  una oleada posterior (si se regenera sin la variable, el sitemap vuelve al
  dominio viejo).

## Medida de humo (`smoke-bench`, sin regresión)

Comando: `node scripts/smoke-bench.mjs --seconds 10 --route / --theme light
--width 1280` (servidor local `.output/server`, build N0 del 2026-09-30).

```json
{
  "route": "/",
  "theme": "light",
  "width": 1280,
  "dpr": 1,
  "cpu": 1,
  "fx": "on",
  "hook": true,
  "tier": 0,
  "emaMs": 0.68,
  "smokeMeanMs": 0.66,
  "smokeP95Ms": 1.4,
  "smokeMaxMs": 2,
  "smokeFrames": 220,
  "pageMeanMs": 16.65,
  "pageP95Ms": 16.8,
  "longtasks": 0,
  "pageFrames": 601
}
```

Lectura: media propia del humo **0,66 ms**, p95 **1,4 ms**, máx 2 ms,
0 tareas largas. Dentro del umbral del plan v2 (media ≤ 2 ms; ≤ 4 ms con
CPU ×4) y coherente con `docs/guides/humo-resultados.md` (0,64–0,71 ms de
media, p95 1,4–1,6). Referencia para N3/N6/N7: repetir la pasada tras cada
cambio de efectos.

## Capturas (claro/oscuro × 1280 px, build N0)

Carpeta: `docs/guides/neo-baseline/`. Sin errores de consola ni de página en
las 8 combinaciones; desbordamiento horizontal 0 px a 1280 px en todas.

| Ruta                                     | Claro                         | Oscuro                       |
| ---------------------------------------- | ----------------------------- | ---------------------------- |
| `/`                                      | `home-light-1280.png`         | `home-dark-1280.png`         |
| `/dispositivos`                          | `dispositivos-light-1280.png` | `dispositivos-dark-1280.png` |
| `/dispositivos/vaporesso-xros-4` (ficha) | `ficha-xros-4-light-1280.png` | `ficha-xros-4-dark-1280.png` |
| `/comparar`                              | `comparar-light-1280.png`     | `comparar-dark-1280.png`     |

`node scripts/visual-smoke.mjs` (30 combinaciones, 5 rutas × 2 temas ×
3 anchos) SÍ se ejecutó — Playwright operativo — pero reporta **10 fallos**,
todos `desbordamiento horizontal` a **360 px** (`/`, `/dispositivos`,
ficha XROS 4, `/resistencias`, `/comparar` × 2 temas). No los causa N0 (esta
oleada solo toca `seo.ts`, `robots.txt` y `sitemap.xml`, sin efecto en
maquetación): el árbol contiene trabajo a medias de oleadas paralelas
(`public/logo*.svg`, `public/favicon.svg`, `src/lib/kinetic/`, `src/lib/fx/`
sin commitear). Pendiente de re-medir cuando las oleadas N1–N3 cierren; no hay
Lighthouse móvil en N0 (queda para N8 con `docs/guides/neo-resultados.md`).

## Discrepancias P1–P4 conocidas (del plan §1.3)

| #                                                                  | Estado en N0                                                                                                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 Despliegue desfasado (`vapelog-beryl` no refleja `main` v0.8.0) | **Pendiente humano** (ver checklist Vercel). Sin acceso al dashboard no se puede confirmar proyecto/rama/commit ni redesplegar.                                                                    |
| P2 Dominio canónico incoherente                                    | **Resuelto en código**: canónico `https://vapelog-alexendros.vercel.app` en `seo.ts`, `sitemap.xml`, `robots.txt` y `site.ts`. Falta verificar el HTML servido en producción tras el redespliegue. |
| P3 `theme-color` estático (`#FCFAF6`)                              | **Conocido, no tocado**: vive en `src/routes/__root.tsx:55,59` (excluido de N0, lo toca N2 con dos `<meta media>` + sincronización).                                                               |
| P4 Títulos por ruta                                                | **Conocido**: home `title = "Vapelog"` es correcto; el resto de rutas se comprueba tras el redespliegue (N8).                                                                                      |

Emisiones OG fuera de `seo.ts` (anotadas, NO editadas — otra oleada):
`src/routes/__root.tsx:18-24` (`og:type`, `og:site_name`, `og:title`,
`og:description`, `og:image` vía `SITE_URL`, ya canónico; sin `og:url`).

## Checklist Vercel (humano, sin acceso al dashboard desde aquí)

- [ ] Confirmar qué proyecto de Vercel sirve `vapelog-beryl.vercel.app` y qué
      rama/commit tiene desplegados (¿apunta a `main` o a otro despliegue/alias?).
- [ ] Confirmar qué proyecto sirve el dominio canónico
      `vapelog-alexendros.vercel.app` y su rama/commit.
- [ ] Redesplegar `main` (v0.8.0+) en el proyecto canónico o corregir el alias,
      sin tocar DNS ni facturación sin confirmación.
- [ ] Verificar en el HTML servido: cabecera con `BrandLogo`, pie en columnas,
      `canonical`/`og:url`/`og:image`/sitemap con el dominio canónico.
- [ ] Fijar `VITE_SITE_URL=https://vapelog-alexendros.vercel.app` en el
      entorno de producción si se usa override por variable.

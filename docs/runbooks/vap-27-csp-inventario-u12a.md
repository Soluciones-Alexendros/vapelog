# Inventario U12A — VAP-27 (CSP y cabeceras)

### Propósito de este documento

- **Objetivos:** Registrar el inventario de scripts y estilos inline en SSR, la política
  CSP declarada en `vercel.json` y las cabeceras de seguridad observables o
  bloqueadas en producción. Fijar el estado de VAP-27 tras U12A.
- **Estructura:** Alcance → cabeceras → inline SSR → riesgo residual → siguientes
  pasos explícitamente fuera de U12A.
- **Contenido a integrar según contexto:** Fecha de la muestra HTTP y commit de
  referencia si se audita de nuevo.

## Estado del hallazgo

| Id         | Estado tras U12A         |
| ---------- | ------------------------ |
| **VAP-27** | **MITIGACIÓN_PENDIENTE** |

U12A es solo inventario. No se activó CSP en modo obligatorio, no se añadieron
`report-uri` / `report-to` ni endpoints de informes.

## Alcance del inventario

- Fuente declarativa de cabeceras: [`vercel.json`](../../vercel.json) (regla
  `source: "/(.*)"`).
- Fuentes de inline en código: [`src/routes/__root.tsx`](../../src/routes/__root.tsx),
  [`src/components/ui/theme-toggle.tsx`](../../src/components/ui/theme-toggle.tsx),
  [`src/components/brand-mark.tsx`](../../src/components/brand-mark.tsx).
- Runtime SSR: TanStack Start / Nitro (`<Scripts />`, streaming TSR).
- Muestra HTML: home `/` (~30,9 KiB), 2026-11-10.

## Cabeceras declaradas en repo

En `vercel.json` para `/(.*)`:

| Cabecera                              | Valor (resumen)                            |
| ------------------------------------- | ------------------------------------------ |
| `X-Content-Type-Options`              | `nosniff`                                  |
| `Referrer-Policy`                     | `strict-origin-when-cross-origin`          |
| `X-Frame-Options`                     | `DENY`                                     |
| `Permissions-Policy`                  | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy-Report-Only` | Ver tabla siguiente                        |

No hay otra definición de CSP ni de `Content-Security-Policy` (modo enforcing) en
el repositorio (búsqueda en árbol de producto, excl. dependencias).

### Política CSP (Report-Only)

```text
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self'
```

Observaciones:

- `script-src` y `style-src` incluyen **`unsafe-inline`**: la política no
  restringe el inline actual; sirve como ensayo o telemetría futura, no como
  barrera XSS.
- No hay directiva `report-uri`, `report-to` ni URL de informes: los informes del
  navegador no tienen destino configurado.

## Cabeceras HTTP en producción

| Destino                                     | Resultado U12A                                                     | Notas                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `https://vapelog.es/` (canónico documental) | **BLOQUEADO**                                                      | Sin resolución DNS en el entorno de auditoría (2026-11-10). No se afirma equivalencia con el alias Vercel.           |
| `https://vapelog-alexendros.vercel.app/`    | **Verificado en vivo** (HTTP 200)                                  | Cabeceras de seguridad coinciden con `vercel.json`. Vercel añade `Strict-Transport-Security` (no declarado en repo). |
| `https://vapelog-beryl.vercel.app/`         | Redirección 308 → alias principal; cabeceras en destino coherentes | Misma política Report-Only tras seguir el redirect.                                                                  |

Cabeceras efectivas en el alias Vercel (muestra `GET /`, 2026-11-10):

- `content-security-policy-report-only`: igual que en repo.
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `x-frame-options: DENY`
- `permissions-policy: camera=(), microphone=(), geolocation=()`
- **Ausente:** `Content-Security-Policy` (enforcing).

Inventario HTML SSR adicional etiquetado como **build local** (`pnpm run build` +
`node .output/server/index.mjs`, misma estructura de inline que la respuesta en
vivo del alias Vercel; hashes de bundler distintos, p. ej. `/assets/index-*.js`).

## Inventario de inline en HTML SSR (home `/`)

Etiqueta de la muestra estructural: corroborada en **respuesta en vivo** del alias
Vercel y en **HTML del build local** (misma cardinalidad de bloques).

### Scripts

| #   | Origen                                             | Tipo                           | ~tamaño | Rol                                                                                                     |
| --- | -------------------------------------------------- | ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `themeBootScript` en `__root` → `theme-toggle.tsx` | Inline en `<head>`             | ~246 B  | Aplica clase `.dark` antes de hidratar según `localStorage` (`vapelog-theme`) y `prefers-color-scheme`. |
| 2   | TanStack Router / Start (streaming)                | Inline, `data-tsr-stream-part` | ~1 KiB  | Bootstrap de hidratación (`$_TSR`, cola de stream).                                                     |
| 3   | TanStack Router / Start                            | Inline                         | ~56 B   | `document.currentScript.remove(); /*$tsr-stream-boundary*/`                                             |
| 4   | Bundler                                            | Externo `type="module"`        | —       | Entrada cliente (`/assets/index-*.js`); no inline.                                                      |

Además: ~11 `link rel="modulepreload"` hacia chunks en `/assets/` (no inline).

### Estilos

| #         | Origen                          | Tipo                                       | Rol                                                                                                               |
| --------- | ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1         | Hoja global                     | Externa                                    | `/assets/styles-*.css` (Tailwind / tokens; incluye `@theme inline` en fuente, no en HTML).                        |
| 1× bloque | `BRAND_CSS` en `brand-mark.tsx` | **Inline** `<style>` dentro del SVG en SSR | Animaciones del logotipo (`.brand-voluta`, keyframes, `prefers-reduced-motion`). Presente en HTML servido (home). |

No se detectaron otros `<script>` inline en rutas de producto fuera del contrato
anterior (búsqueda estática en `src/`).

## Riesgo residual

1. **CSP sin efecto protector hoy:** modo Report-Only + `unsafe-inline` en
   `script-src` y `style-src` no limita XSS vía inline. No hay enforcing ni
   informes utilizables.
2. **Dependencia estructural del inline:** quitar `unsafe-inline` sin rediseño
   (nonce/hash, externalizar `themeBootScript`, streaming TSR) rompería hidratación
   o tema sin parpadeo. U12B debe diseñar esa transición.
3. **SVG con `<style>` inline:** el bloque de marca duplica CSS en cada instancia
   SSR del logo; para CSP estricta haría falta hash o CSS en hoja externa.
4. **Canónico `vapelog.es` sin verificación HTTP en U12A:** el inventario de
   cabeceras en el dominio documental queda pendiente de una auditoría con DNS y
   ruta resolviendo (mismo criterio que otros hallazgos «cabeceras vivas
   bloqueadas» en el plan maestro).
5. **`connect-src 'self'`:** futuras integraciones (analytics, APIs externas)
   requerirían ampliar la política antes de un enforcing estricto.

## Fuera de alcance (U12A)

- Activar `Content-Security-Policy` enforcing.
- Añadir endpoint o URL de informes CSP.
- U12B (diseño nonce/hash en servidor local) y U12C (despliegue con aprobación
  operativa).

## Referencias

- Plan de consolidación, unidad U12A (VAP-27).
- [`docs/cierre/plan-maestro-cierre-produccion.md`](../cierre/plan-maestro-cierre-produccion.md) — cierre previsto de cabeceras verificadas.

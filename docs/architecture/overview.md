# Overview de arquitectura

### Propósito de este documento

- **Objetivos:** Explicar el flujo de datos y el perímetro del sistema.
- **Estructura:** Runtime → datos → UI → deploy.
- **Contenido a integrar según contexto:** Complementa [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Runtime

TanStack Start monta un servidor Vite SSR. Las rutas en `src/routes/` cargan
componentes que leen el catálogo tipado desde `src/data/`. No hay ORM ni API
REST propia: la «fuente de verdad» del producto es el TypeScript del catálogo
más las fotos en `public/catalog/`.

## Datos

- `catalog.ts` — ítems por dominio.
- `spec-def.ts` / `specs.ts` — plantilla de ficha y filas comparables.
- `logic.ts` — cruce dispositivo↔coil y recomendaciones de líquido.
- `search.ts` — búsqueda por característica.

Regla: si no hay fuente, no se inventa el dato (`Sin dato publicado`).

## UI

Componentes propios estilo shadcn en `src/components/ui/` con tokens OKLCH
semánticos (neutros tono ≈ 260 y acento azul-grisáceo;
[ADR-0017](./decisions/ADR-0017-paleta-neutra.md)). Fichas en `sheets.tsx`
(cabecera + hero chips + accordion). Tema claro/oscuro vía clase `.dark`,
clave `vapelog-theme`. Dirección sobria sin humo ni neón
([ADR-0016](./decisions/ADR-0016-direccion-visual-sobria.md)).

## Deploy

Build produce `dist/client` + `dist/server`. Preview local / smoke usan
`vite preview`. Producción prevista en Vercel (ver runbook deploy).

## Contratos de dominio y operación

Índice de punteros; el detalle vive en código, tests y ADRs citados (sin
duplicar tablas de aceptación).

| Tema                                                           | Fuente de verdad                                                                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modo y pestaña en `/herramientas` (query URL, precedencia Ohm) | `src/components/tool-search.ts`, `src/routes/herramientas.tsx`; tests en `src/data/tool-search.test.ts`                                                                     |
| Ventana eléctrica y `unknown` frente a match                   | [ADR-0011](./decisions/ADR-0011-normalizacion-dominio.md) §4; `src/data/compat-evaluation.ts`, `src/data/logic.ts`                                                          |
| TPD `desconocido` / `no-aplica` / `parcial`                    | [ADR-0013](./decisions/ADR-0013-entidades-fisicas.md); `src/data/tpd.ts`; etiquetas en `src/components/labels.ts`                                                           |
| Etiquetas de encaje (laboratorio y fichas)                     | `src/components/labels.ts` (`fitLabel`, tonos CompatLab); alineado con el evaluador                                                                                         |
| Gate de cobertura (≥ 70 % líneas, ámbito CI)                   | [Guía testing](../guides/testing.md); `scripts/coverage-gate.mjs`, `scripts/run-unit-tests.mjs`                                                                             |
| Release sin push a `main` y reconcile tag/release              | [ADR-0015](./decisions/ADR-0015-release-sin-push-a-main.md); `scripts/release.mjs` (`reconcilePublishedVersion`); tests `scripts/release*.test.mjs`                         |
| Caché `/catalog` revalidar; `/assets` immutable                | [ADR-0010](./decisions/ADR-0010-dominio-canonico.md) (`vercel.json`)                                                                                                        |
| Matriz Node (CI 22.x, Vercel 24.x, tipos)                      | [ADR-0018](./decisions/ADR-0018-matriz-runtime-node.md); `.nvmrc`, `package.json#engines`                                                                                   |
| Acceso a Preview protegido (bypass, environment, required)     | [Runbook VAP-22](../runbooks/vap-22-preview-merge-y-aceptacion-u-ops.md); `scripts/check-preview-bypass.mjs`, `scripts/wait-preview-url.mjs`, `e2e/preview/global-setup.ts` |

## Mantenimiento documental

**VAP-29 (abierto):** la página Notion «Vapelog» y propiedades residuales
(`Versión`, `Última revisión`) siguen sin sincronizar con este contraste;
corresponde al mantenedor y no se actualiza Notion desde el repo sin
aprobación explícita.

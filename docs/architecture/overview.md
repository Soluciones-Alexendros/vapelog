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
semánticos. Fichas en `sheets.tsx` (cabecera + hero chips + accordion). Tema
claro/oscuro vía clase `.dark`.

## Deploy

Build produce `dist/client` + `dist/server`. Preview local / smoke usan
`vite preview`. Producción prevista en Vercel (ver runbook deploy).

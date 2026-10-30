# Arquitectura — Vapelog

### Propósito de este documento

- **Objetivos:** Describir la forma del sistema a alto nivel y apuntar a
  overview y ADRs.
- **Estructura:** Resumen → mapa → enlaces.
- **Contenido a integrar según contexto:** No dupliques runbooks ni el
  detalle de tokens; enlázalos.

## Resumen

Vapelog es una aplicación SSR con **TanStack Start** (Vite + React Router)
que sirve un catálogo tipado en TypeScript (`src/data/`). Las fichas se
renderizan en el cliente/SSR desde datos en memoria; las imágenes fuente viven
en `assets/catalog/` (tracked, no se sirven) y sus variantes webp/avif generadas
en `public/catalog/` (regenerar con `pnpm run images`). No hay base de datos en
runtime ni autenticación.

## Mapa

| Área          | Ubicación                     |
| ------------- | ----------------------------- |
| Rutas         | `src/routes/`                 |
| Fichas / UI   | `src/components/`             |
| Catálogo      | `src/data/catalog.ts` + specs |
| Tokens / tema | `src/styles.css` (ADR-0016)   |
| Smoke / env   | `scripts/`                    |

## Detalle

- Overview: [docs/architecture/overview.md](docs/architecture/overview.md)
- ADRs: [docs/architecture/decisions/](docs/architecture/decisions/)

### Dirección visual sobria ([ADR-0016](docs/architecture/decisions/ADR-0016-direccion-visual-sobria.md))

- Superficies neutras y opacas, radio único, tipografía Public Sans + Space Mono
  para cifras. Sin neón, glow, brutalismo decorativo, humo canvas ni conmutador
  de efectos. Tema `vapelog-theme` (claro / oscuro / sistema) se conserva.
- Color por tipo (`--kind-*`) como marcador con icono y etiqueta
  (`KindCard` en `src/components/ui/kind-card.tsx`).
- Inventario histórico de humo y neo-brutalismo: ADR-0007 / ADR-0008 /
  ADR-0009 (sustituidos en estilo). Plan vigente: [docs/plan-vapelog.md](docs/plan-vapelog.md).

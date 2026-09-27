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
renderizan en el cliente/SSR desde datos en memoria; las fotos viven en
`public/catalog/`. No hay base de datos en runtime ni autenticación.

## Mapa

| Área          | Ubicación                     |
| ------------- | ----------------------------- |
| Rutas         | `src/routes/`                 |
| Fichas / UI   | `src/components/`             |
| Catálogo      | `src/data/catalog.ts` + specs |
| Tokens / tema | `src/styles.css`              |
| Smoke / env   | `scripts/`                    |

## Detalle

- Overview: [docs/architecture/overview.md](docs/architecture/overview.md)
- ADRs: [docs/architecture/decisions/](docs/architecture/decisions/)

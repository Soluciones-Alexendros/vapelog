# Vapelog

### Propósito de este documento

- **Objetivos:** Presentar el producto, el arranque local y los contratos
  (CI, docs, seguridad) sin sustituir runbooks ni el índice operativo.
- **Estructura:** Estado → desarrollo → env → arquitectura → documentación.
- **Contenido a integrar según contexto:** Adapta stack y comandos de este
  catálogo (`pnpm`, TanStack Start). No copies un README de SaaS con auth.
  Los incidentes viven en [SUPPORT.md](SUPPORT.md) y [docs/runbooks/](docs/runbooks/).

Catálogo técnico de dispositivos, resistencias, líquidos y componentes de vapeo
para el mercado de la UE. Fichas con fuente, cruce y calculadoras. **No es una
tienda** y no vende nicotina.

Contratos: [AGENTS.md](AGENTS.md) · [ARCHITECTURE.md](ARCHITECTURE.md) ·
[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) ·
[SUPPORT.md](SUPPORT.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

|                |                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Estado**     | Catálogo puro (sin auth / multiplayer / broker Grok)                                                                                                               |
| **Producción** | [vapelog-alexendros.vercel.app](https://vapelog-alexendros.vercel.app)                                                                                             |
| **Visual**     | Paleta neutra tono 260 · JetBrains Mono · [ADR-0017](docs/architecture/decisions/ADR-0017-paleta-neutra.md) · [aceptación v2](docs/cierre/aceptacion-v2-visual.md) |
| **Stack**      | TanStack Start · React 19 · TypeScript · Tailwind v4 · OKLCH · Nitro                                                                                               |
| **Gestor**     | pnpm · Node 22                                                                                                                                                     |

[![CI](https://github.com/Soluciones-Alexendros/vapelog/actions/workflows/ci.yml/badge.svg)](https://github.com/Soluciones-Alexendros/vapelog/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Soluciones-Alexendros/vapelog)](https://github.com/Soluciones-Alexendros/vapelog/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Desarrollo

```bash
git clone git@github.com:Soluciones-Alexendros/vapelog.git && cd vapelog
pnpm install
pnpm dev
```

### Comandos

| Comando                        | Uso                                         |
| ------------------------------ | ------------------------------------------- |
| `pnpm dev`                     | Servidor de desarrollo                      |
| `pnpm run build`               | Build de producción (`.output/`)            |
| `pnpm run typecheck`           | `tsc --noEmit`                              |
| `pnpm run lint`                | ESLint                                      |
| `pnpm run format:check`        | Prettier                                    |
| `pnpm test`                    | Tests unitarios (`node:test`)               |
| `pnpm run test:coverage`       | Cobertura (≥70 % líneas en CI)              |
| `pnpm run smoke`               | Smoke HTTP del preview                      |
| `pnpm run a11y`                | axe serious+critical sobre el build         |
| `pnpm run visual-smoke`        | Desbordamiento horizontal (viewport × tema) |
| `pnpm run aceptacion:capturas` | PNGs de la matriz de aceptación visual v2   |
| `pnpm run e2e`                 | Build + Nitro + a11y + browser-smoke        |
| `pnpm run check:env`           | Valida `.env.example`                       |
| `make validate`                | lint + test + build + smoke                 |

## Variables de entorno

La app **no requiere** variables obligatorias. Ver [.env.example](.env.example).

## Arquitectura

Visión en [ARCHITECTURE.md](ARCHITECTURE.md) y
[docs/architecture/overview.md](docs/architecture/overview.md). ADRs en
[docs/architecture/decisions/](docs/architecture/decisions/).

## Documentación

Índice: [docs/README.md](docs/README.md).

Cierre visual v2 (U1–U9): expediente
[docs/cierre/aceptacion-v2-visual.md](docs/cierre/aceptacion-v2-visual.md) y
capturas en [docs/cierre/aceptacion-v2/capturas/](docs/cierre/aceptacion-v2/capturas/).
Las casillas de la matriz las marca un humano tras revisar los PNG; regenerar
con `pnpm run build && pnpm run aceptacion:capturas`.

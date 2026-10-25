# Contribuir — Vapelog

### Propósito de este documento

- **Objetivos:** Explicar setup, flujo de rama/PR y reglas locales para
  contribuir sin romper el catálogo ni el contrato de scripts.
- **Estructura:** Requisitos → flujo → commits → CI → seguridad.
- **Contenido a integrar según contexto:** Adapta scripts pnpm y jobs CI.
  Lee [AGENTS.md](AGENTS.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Requisitos

- Node **22** (`.nvmrc` / `engines`)
- pnpm (`packageManager` en `package.json`)

## Flujo

1. Rama desde `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`).
2. `pnpm install`
3. `pnpm run typecheck && pnpm run lint && pnpm test`
4. `pnpm run build && pnpm run smoke` (o `make validate`).
5. PR con CI verde (ver [CI y `release-ready`](#ci-y-release-ready)). Revisión
   `@Alexendros`.

## Commits

Conventional Commits (`feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`).

## CI y `release-ready`

Verificado contra [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

El check obligatorio de `main` es **`release-ready`**. Ese job (`if: always()`)
agrega y exige `success` en:

| Job               | Rol                                             |
| ----------------- | ----------------------------------------------- |
| `quality`         | format, typecheck, lint, `check:env`            |
| `test`            | unitarios + cobertura ≥ 70 %                    |
| `build`           | build + manifiesto                              |
| `smoke`           | smoke HTTP del artefacto                        |
| `browser`         | a11y-pass + browser-smoke                       |
| `fx-e2e`          | Playwright local (humo FX / DOM budget)         |
| `supply-chain`    | `pnpm audit` high, GHSA, actionlint, Trufflehog |
| `sql-integration` | Postgres 16 + DDL + fixtures FK/unicidad        |

Fuera del agregador (no bloquean `release-ready`):

| Job / workflow    | Motivo                                                                              |
| ----------------- | ----------------------------------------------------------------------------------- |
| `smoke-bench`     | Informativo (`continue-on-error`)                                                   |
| `release`         | Solo push a `main` tras el gate; no hace push a `main` (ADR-0015)                   |
| `secrets` / `sca` | Workflow `security.yml` (otro workflow; no pueden ir en `needs` de `release-ready`) |
| `preview-e2e`     | Solo PR; espera Preview de Vercel; fuera del agregador para evitar deadlock         |

Detalle operativo: [docs/runbooks/deploy.md](docs/runbooks/deploy.md).

### Propuesta para Alejandro (no aplicada)

1. Conservar el required check **`release-ready`** (strict, sin historial lineal).
2. Añadir **`secrets`** y **`sca`** como required checks adicionales.
3. La lista corta del plan-prompt (`quality`, `test`, `build`, `smoke`,
   `secrets`) **no** debe reemplazar a `release-ready`: dejaría de bloquear
   `browser`, `fx-e2e`, `supply-chain` y `sql-integration`.
4. Decidir `enforce_admins` y el método de merge de la flota (hoy el repo solo
   permite squash; la preferencia de flota es merge commit).

## Seguridad

Vulnerabilidades: ver [SECURITY.md](SECURITY.md). No abras issues públicos con
detalles explotables.

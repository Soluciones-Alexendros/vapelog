# Baseline de cierre — 2026-10-30

### Propósito de este documento

- **Objetivos:** Fotografía al iniciar la implementación del plan de
  cierre verificable (sustituye el F00 de 2026-10-17 como estado actual).
- **Estructura:** Git → runtime → CI → PRs abiertos → no verificado.
- **Contenido a integrar según contexto:** completar con SHA del PR
  fusionado y enlaces de Actions al aceptar.

## Git

| Campo                  | Valor                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `origin/main` (inicio) | `efb703c2883424f48b6f497d4c55b52c3639c24b` (#25 secrets/sca) |
| App                    | `0.13.0` (tag `v0.13.0`)                                     |
| Schema                 | `1.4.0`                                                      |
| Catálogo               | `2026-10-17.entidades-fisicas`                               |
| Árbol local            | limpio al inspeccionar; implementación en rama de cierre     |

## Runtime

| Campo           | Valor     |
| --------------- | --------- |
| Node (`.nvmrc`) | `22`      |
| pnpm            | `11.21.0` |

## CI (contrato)

- Agregador: **`release-ready`** con lista cerrada `REQUIRED_JOBS`.
- Incluye: quality, test, build, smoke, browser, fx-e2e, supply-chain,
  sql-integration, secrets, sca.
- Fuera del gate: smoke-bench, preview-e2e, release (solo push a main).
- `make validate` ≠ CI completa (perfil `harness local`).

## PRs abiertos al inspeccionar

| PR  | Tema                 | Nota                          |
| --- | -------------------- | ----------------------------- |
| #26 | docs required checks | Reutilizar / alinear docs     |
| #27 | Renovate zod         | Carril aparte                 |
| #28 | preview E2E          | Reutilizado y endurecido aquí |

## No verificado en la inspección

- Ruleset / branch protection (API 403).
- SHA vivo de producción vía postdeploy (operador).
- Verde de `preview-e2e` real (rate limit Vercel).

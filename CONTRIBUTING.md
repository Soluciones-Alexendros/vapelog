# Contribuir — Vapelog

### Propósito de este documento

- **Objetivos:** Explicar setup, flujo de rama/PR y reglas locales para
  contribuir sin romper el catálogo ni el contrato de scripts.
- **Estructura:** Requisitos → flujo → commits → seguridad.
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
5. PR con CI verde. El check agregador es **`release-ready`**: exige
   `success` en `quality`, `test`, `build`, `smoke`, `browser`, `fx-e2e`,
   `supply-chain` y `sql-integration` (lista única en
   `scripts/release-ready.mjs` → `REQUIRED_JOBS`, paridad con
   `.github/workflows/ci.yml`). Fuera del agregador: `smoke-bench`
   (informativo), `release` (solo push a `main`), `preview-e2e` si existe
   (aceptación desplegada; no entra en el gate de integración). Revisión
   `@Alexendros`. El método de merge del repo es el configurado en
   GitHub (hoy squash); no inventar merge commits si el remoto no los
   admite.

## Commits

Conventional Commits (`feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`).

## Seguridad

Vulnerabilidades: ver [SECURITY.md](SECURITY.md). No abras issues públicos con
detalles explotables.

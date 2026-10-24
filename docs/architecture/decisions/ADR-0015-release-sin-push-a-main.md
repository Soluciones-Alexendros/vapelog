# ADR-0015 — Release sin push directo a main

### Propósito de este documento

- **Objetivos:** Evitar GH006 al publicar versión bajo protección de
  rama que exige el check `release-ready`.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** ADR-0012, `scripts/release.mjs`,
  job `release` en `.github/workflows/ci.yml`,
  [docs/runbooks/deploy.md](../../runbooks/deploy.md).

## Estado

Aceptado (2026-10-25).

## Contexto

Con `main` protegida y el check obligatorio `release-ready`, el job
`release` fallaba al hacer `git push origin HEAD:main` tras el commit
`chore(release)`: ese SHA nuevo no tenía el check y GitHub respondía
GH006. No se desactiva la protección ni se añade bypass del bot.

## Decisión

1. `scripts/release.mjs` planifica en dos fases: `open-pr` (rama
   `chore/release-vX.Y.Z` + PR) o `publish` (tag + GitHub Release sobre
   el `HEAD` ya fusionado). Nunca actualiza `refs/heads/main`.
2. El bump de `package.json` y `CHANGELOG.md` entra por PR para que
   `release-ready` exista antes del merge.
3. El tag se publica solo cuando `package.json` ya contiene la versión
   calculada y el tag aún no existe. Las notas incluyen `Tested-SHA`.
4. El merge del PR de release debe hacerse con token de usuario (un merge
   con `GITHUB_TOKEN` no relanza workflows y el tag no se publicaría).

## Consecuencias

- Sustituye la consecuencia de ADR-0012 sobre bypass de
  `github-actions[bot]` para el push del commit de versión.
- Puede coexistir un PR de release abierto mientras `main` avanza; el job
  rehace la rama con `--force-with-lease` solo en
  `chore/release-vX.Y.Z`.
- Force-push a `main` y cambios en la protección de ramas siguen
  prohibidos.

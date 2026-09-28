# Runbook — deploy (Vercel)

### Propósito de este documento

- **Objetivos:** Documentar la cadena de publicación automática y la
  verificación manual cuando haga falta.
- **Estructura:** Pipeline automático → qué se publica → verificación →
  excepciones.
- **Contenido a integrar según contexto:** No incluye secretos reales. El
  rollback vive en [rollback.md](./rollback.md).

## Pipeline automático (ruta feliz)

No hay pasos manuales: todo se dispara con un push a `main`.

1. **CI** (`ci.yml`): `quality` → `test` (cobertura ≥70 %) → `build` →
   `smoke` y `browser` (Playwright: a11y-pass + browser-smoke contra el
   build Nitro).
2. **Release** (job `release`, solo en `main` y solo si `smoke` y `browser`
   pasan): `scripts/release.mjs` decide el semver desde los Conventional
   Commits (`feat!`/BREAKING → major, `feat` → minor, `fix` → patch),
   mueve el contenido de `## [Unreleased]` en `CHANGELOG.md`, sube
   `package.json`, crea commit `chore(release): vX.Y.Z`, tag y
   **GitHub Release** con las notas del changelog. Si no hay `feat`/`fix`
   nuevos, no publica nada.
3. **Vercel** (GitHub App del proyecto `alexendros-team/vapelog`): cada push
   a `main` despliega a producción automáticamente. El build emite el
   Build Output API (`.vercel/output`) porque `vite.config.ts` activa el
   preset `vercel` de Nitro cuando `VERCEL=1`.

El commit de release vuelve a pasar la CI y no dispara otra versión (un
`chore(release)` no contiene `feat`/`fix`): no hay bucle.

## Qué se publica

- Producción: [vapelog-beryl.vercel.app](https://vapelog-beryl.vercel.app).
- Rama de producción en Vercel: `main`. El estado del deploy aparece como
  check «Vercel» en cada commit.

## Verificación tras un push

1. Check «Vercel» en verde en el commit de `main`.
2. `curl -s https://vapelog-beryl.vercel.app/dispositivos | grep "XROS 4"`
   (el HTML sirve contenido real; ver ADR-0004).
3. Una ficha de cada dominio y el toggle de tema (claro y oscuro).
4. Nueva versión y release en
   <https://github.com/Soluciones-Alexendros/vapelog/releases>.

## Excepciones

- **Publicar sin release**: un cambio `docs:`/`chore:` llega a producción
  sin versión nueva; es lo previsto.
- **Release manual local** (p. ej. tras un merge retrasado):
  `node scripts/release.mjs --dry-run` para previsualizar y, con la CI en
  verde, `node scripts/release.mjs` sobre `main` actualizado.
- **Rotura en producción**: seguir [rollback.md](./rollback.md).

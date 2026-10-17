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

1. **CI** (`ci.yml`): `quality` → en paralelo `test`, `build`,
   `supply-chain` y `sql-integration` (Postgres 16 efímero + DDL);
   tras `build` → `smoke`, `browser` y `fx-e2e`.
   `smoke-bench` es informativo (`continue-on-error`) y **no** bloquea.
2. **Gate** (job `release-ready`, `if: always()`): solo pasa si
   `quality`, `test`, `build`, `smoke`, `browser`, `fx-e2e`,
   `supply-chain` y `sql-integration` están en `success`. Un job
   `skipped`, `cancelled` o `failure` deja el gate en rojo
   (`scripts/release-ready.mjs`).
3. **Postdeploy** (manual o pipeline futuro):
   `POSTDEPLOY_URL=… EXPECTED_COMMIT=… pnpm run test:postdeploy`
   contra `/build-manifest.json`.
4. **Release** (job `release`, solo en `main` y solo si `release-ready`
   pasa): `scripts/release.mjs` decide el semver desde los Conventional
   Commits (`feat!`/BREAKING → major, `feat` → minor, `fix` → patch),
   mueve el contenido de `## [Unreleased]` en `CHANGELOG.md`, sube
   `package.json`, crea commit `chore(release): vX.Y.Z`, tag y
   **GitHub Release** con las notas del changelog más `Tested-SHA` (SHA
   del workflow que pasó el gate; no confundir con el commit de versión).
   Si no hay `feat`/`fix` nuevos, no publica nada.
5. **Vercel** (GitHub App del proyecto `alexendros-team/vapelog`): cada
   push a `main` despliega a producción automáticamente. El acoplamiento
   «push a main → deploy» se conserva; este runbook no reconfigura el
   proyecto Vercel. El build emite el Build Output API (`.vercel/output`)
   porque `vite.config.ts` activa el preset `vercel` de Nitro cuando
   `VERCEL=1`. El build genera `public/build-manifest.json` (identidad
   del artefacto).

El commit de release vuelve a pasar la CI y no dispara otra versión (un
`chore(release)` no contiene `feat`/`fix`): no hay bucle.

## Qué se publica

- Producción: [vapelog-alexendros.vercel.app](https://vapelog-alexendros.vercel.app).
- Rama de producción en Vercel: `main`. El estado del deploy aparece como
  check «Vercel» en cada commit.

## Verificación tras un push

1. Check `release-ready` en verde en el commit de `main` (y check
   «Vercel»).
2. `curl -s https://vapelog-alexendros.vercel.app/dispositivos | grep "XROS 4"`
   (el HTML sirve contenido real; ver ADR-0004).
3. Si existe, contrastar `/build-manifest.json` con el `Tested-SHA` del
   release (si el SHA servido no se puede leer: **NO VERIFICADO**).
4. Una ficha de cada dominio y el toggle de tema (claro y oscuro).
5. Nueva versión y release en
   <https://github.com/Soluciones-Alexendros/vapelog/releases>.

## Excepciones

- **Publicar sin release**: un cambio `docs:`/`chore:`/`ci:` llega a
  producción sin versión nueva; es lo previsto.
- **Release manual local** (p. ej. tras un merge retrasado):
  `node scripts/release.mjs --dry-run` para previsualizar y, con la CI en
  verde, `node scripts/release.mjs` sobre `main` actualizado.
- **Rotura en producción**: seguir [rollback.md](./rollback.md).

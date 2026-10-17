# ADR-0012 — Alcance de cierre, gates y SQL diferido

### Propósito de este documento

- **Objetivos:** Congelar el alcance de la candidata de cierre (PR-A en
  adelante), fijar el grafo de publicación y dejar el SQL fuera del gate
  hasta F06.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Plan maestro y matriz en
  [docs/cierre/](../../cierre/); jobs `release-ready` y `supply-chain` en
  `.github/workflows/`.

## Estado

Aceptado (2026-10-17) — PR-A (OBJ-001–005).

## Contexto

El plan maestro de cierre (F00–F10) exige evidencia real antes de declarar
producción. En v0.12.0 (`48d5359`) el job `release` solo dependía de
`smoke` y `browser`, de modo que `test` o `fx-e2e` podían fallar y aún así
publicar versión. El workflow de seguridad descargaba actionlint con
`curl | bash`. El SQL objetivo (`public/vapelog-esquema.sql`) no se
instala en CI; meterlo ahora como check verde sería evidencia falsa
(OBJ-018 / F06).

## Decisión

1. **Alcance de candidata.** Incluye catálogo tipado, comparación,
   compatibilidad, calculadoras y contenido publicado. **Fuera de alcance**
   salvo ADR posterior: autenticación de usuarios, pagos, tienda, base de
   datos en runtime y comunidad.
2. **SQL.** Las pruebas de instalación/restricciones Postgres quedan fuera
   del agregador `release-ready` hasta F06 (OBJ-018). El test actual
   `scripts/sql-schema-install.test.mjs` no cuenta como gate de esquema.
3. **Grafo de publicación.** `release` depende únicamente de
   `release-ready`. Ese job (`if: always()`) exige `success` en
   `quality`, `test`, `build`, `smoke`, `browser`, `fx-e2e` y
   `supply-chain`. `skipped`, `cancelled` y `failure` fallan el gate.
   `smoke-bench` sigue informativo (`continue-on-error`) y **no** entra en
   el agregador.
4. **Manifiesto.** Cada build escribe `public/build-manifest.json`
   (gitignorado) con commit, versión, `schemaVersion`, `catalogRevision`,
   hash del lockfile y `buildId`. El commit `chore(release)` no se
   presenta como el SHA del artefacto probado; las notas del GitHub
   Release incluyen `Tested-SHA`.
5. **Cadena de suministro.** `pnpm audit --prod` (umbral alto/crítico),
   actionlint por acción fijada a SHA (sin `curl | bash`) y escáner de
   secretos en CI. El contraste de GHSA-qx66-fv34-fjm8 se hace contra las
   versiones **resueltas** del lockfile.
6. **Remediación / excepciones (baseline PR-A).**
   - GHSA-qx66-fv34-fjm8: `@tanstack/start-server-core@1.169.43` y
     `@tanstack/react-start@1.169.2` están **fuera** de los rangos
     vulnerables documentados (`< 1.169.39` y `< 1.168.60`
     respectivamente). Sin bump masivo.
   - GHSA-68fv-2mgg-jv7q (`source-map-js` &lt; 1.2.2): se fuerza
     `overrides` en `pnpm-workspace.yaml` a `>=1.2.2` (dependencia
     transitiva de Vite/PostCSS en build; pnpm 11 ya no lee
     `package.json#pnpm.overrides`). Sin excepción abierta.

## Consecuencias

- Un fallo o omisión de un check obligatorio impide `release` y, con la
  protección de `main` exigiendo `release-ready`, impide merge a la rama
  de producción.
- El bypass de restricción de push (si se activa) debe incluir
  `github-actions[bot]` para que `scripts/release.mjs` pueda publicar el
  tag; no se activa `enforce_admins`.
- F02–F10 (compatibilidad canónica, entidades, SQL real, UI, E2E
  multibrowser, postdeploy) no se implementan en este ADR.

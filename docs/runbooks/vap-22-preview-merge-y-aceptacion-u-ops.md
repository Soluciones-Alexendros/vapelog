# Runbook — política Preview / merge y aceptación de producción (U-OPS, VAP-22)

### Propósito de este documento

- **Objetivos:** Fijar el contrato operativo entre protección de `main`, grafo de
  CI, despliegue Vercel y aceptación humana de producción. Registrar la
  inspección de GitHub (sin mutar rulesets ni desplegar).
- **Estructura:** Evidencia GitHub → grafo de checks → riesgo de ciclo Preview →
  escenarios de ensayo → decisión pendiente (XOR) → checklist de aceptación →
  referencias.
- **Contenido a integrar según contexto:** Fecha de relectura API, SHA de
  referencia del repo y configuración efectiva del proyecto Vercel (panel, no
  inferida solo desde este repo).

## Estado

| Id         | Estado tras U-OPS                                           |
| ---------- | ----------------------------------------------------------- |
| **VAP-22** | **POLÍTICA_DOCUMENTADA — decisión de mantenedor pendiente** |

U-OPS no modifica rulesets, branch protection ni Vercel. No sustituye la firma
del [expediente de aceptación](../cierre/expediente-aceptacion.md).

## Evidencia GitHub (inspección API)

**Fecha:** 2026-11-10. **Repositorio:** `Soluciones-Alexendros/vapelog`. **Origen:**
`gh api` (lectura).

### Protección clásica de `main`

| Campo                               | Valor observado                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `required_status_checks.strict`     | `true` (el commit del PR debe estar al día con `main`)                              |
| Contextos obligatorios              | Solo **`release-ready`** (`app_id`: null → check de GitHub Actions, no app externa) |
| `enforce_admins`                    | `false`                                                                             |
| `required_linear_history` (clásico) | `false`                                                                             |
| `required_signatures` (clásico)     | `false`                                                                             |
| Force push / borrado                | Deshabilitados                                                                      |

**Consecuencia:** GitHub **no** exige, a nivel de merge a `main`, los jobs
individuales (`test`, `browser`, …) ni `preview-e2e`, ni el check de la app
**Vercel**. Solo exige el agregador `release-ready`. Los demás aparecen en el PR
como información salvo que el ruleset o la config de Vercel añada otro requisito
fuera de esta API.

### Ruleset `26288300` — `main: squash (sin ci-gate)`

| Aspecto                  | Detalle                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Target**               | `branch`, `refs/heads/main`                                                  |
| **Enforcement**          | `active`                                                                     |
| **Creado / actualizado** | 2026-10-31                                                                   |
| **Bypass**               | `bypass_actors`: vacío; `current_user_can_bypass`: `never`                   |
| **Merge**                | Solo **squash**; `required_approving_review_count`: 0                        |
| **PR**                   | Resolución de hilos obligatoria; aprobación extra para cambios no atribuidos |
| **Historial**            | `required_linear_history`: **sí** (en ruleset; distinto del flag clásico)    |
| **Firmas**               | `required_signatures`: **sí** (en ruleset)                                   |
| **Code scanning**        | CodeQL, umbral `high_or_higher` / alertas `errors`                           |
| **Checks de CI**         | **No** hay regla `required_status_checks` en el ruleset                      |

El nombre del ruleset (`sin ci-gate`) coincide con la evidencia: el gate de CI
sigue viviendo en la **protección clásica** (`release-ready`), no en el ruleset.

### Ruleset `26288301` — `plan/*: squash (sin ci-gate)`

Igual patrón que `26288300`, aplicado a `refs/heads/plan/*`: squash, CodeQL, sin
lista de jobs de Actions en el ruleset; sin bypass configurado.

### Eventos de workflow relevantes

| Workflow          | `push` → `main`                               | `pull_request` → `main` |
| ----------------- | --------------------------------------------- | ----------------------- |
| `ci.yml`          | Sí                                            | Sí                      |
| `security.yml`    | Sí                                            | Sí                      |
| Job `preview-e2e` | **No** (`if: pull_request` → omitido en push) | Sí                      |
| Job `release`     | Sí (si `release-ready` verde)                 | **No** (omitido en PR)  |

### Checks que alimentan `release-ready`

Lista cerrada (`scripts/release-ready.mjs` → `REQUIRED_JOBS`, paridad con
`.github/workflows/ci.yml`):

`quality`, `test`, `build`, `smoke`, `browser`, `fx-e2e`, `supply-chain`,
`sql-integration`, `secrets`, `sca`.

**Fuera del agregador (no bloquean `release-ready`):**

| Job / check                        | Rol                                     | ¿Bloquea merge a `main`?                               |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `smoke-bench`                      | Informativo (`continue-on-error`)       | No                                                     |
| `preview-e2e`                      | E2E catálogo contra URL Preview Vercel  | **No** (no está en protección clásica ni en ruleset)   |
| `release`                          | Tag / GitHub Release tras push a `main` | No en PR; en push no bloquea merge (ya mergeado)       |
| Check «Vercel» (app)               | Deploy Preview / Production             | **No** en la API de protección leída; ver panel Vercel |
| Jobs de `security.yml` en schedule | Auditoría programada                    | No sustituyen `sca`/`secrets` de `ci.yml` en el PR     |

## Riesgo de ciclo Vercel ↔ `preview-e2e` ↔ `release-ready`

En `.github/workflows/ci.yml`, el job `preview-e2e` está **fuera** de `needs` de
`release-ready` con este motivo explícito:

> Si entrara en el gate, un required check bloquearía el deploy de Vercel.

Cadena típica en PR:

1. Push al PR → CI corre `release-ready` (y el resto de jobs obligatorios).
2. La app Vercel construye y publica **Preview** (suele colgar del mismo commit;
   puede estar configurada para esperar checks concretos).
3. `preview-e2e` espera hasta 900 s la URL de Preview (`wait-preview-url.mjs`).
   Si Deployment Protection / SSO está activo, el probe ve redirect a
   `vercel.com/sso-api` y falla en el intento 1. Remedio: secreto de repo
   `VERCEL_AUTOMATION_BYPASS_SECRET` (mismo valor que Automation Bypass en
   Vercel) o relajar protección en Previews. Sin el secreto, `release-ready`
   sigue pudiendo quedar verde (el job no está en `needs`).
   y ejecuta Playwright (`playwright.preview.config.ts`).

**Riesgo si se mete `preview-e2e` dentro de `release-ready` sin reconfigurar
Vercel:** Preview podría esperar `release-ready` → `release-ready` esperaría
`preview-e2e` → `preview-e2e` espera Preview → **bloqueo circular**.

**Cobertura parcial sin Preview:** `fx-e2e` ya ejecuta la misma suite
`playwright.preview.config.ts` contra **Nitro local**, no contra el runtime/cabeceras
CDN de Vercel. Verde en `fx-e2e` **no** equivale a Preview desplegada ni a
`preview-e2e` verde.

**Afirmación no permitida:** «Preview no bloquea» **no** es garantía de calidad ni
de merge seguro; solo describe el estado actual de la protección de GitHub.

## Ensayo documentado (sin experimento destructivo en `main`)

Escenarios para validar el contrato del agregador (`scripts/release-ready.mjs`
y `scripts/release-ready.test.mjs`); no requieren tocar `main` si se ejecutan en
rama de prueba o en unitarios:

| Escenario                               | Resultado esperado del contrato                                            |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Job obligatorio en `failure`            | `release-ready` rojo; merge bloqueado por protección clásica               |
| Job obligatorio `skipped` / `cancelled` | `release-ready` rojo (`if: always()` no perdona omisión)                   |
| Job obligatorio ausente en JSON `needs` | `release-ready` rojo                                                       |
| Clave extra o de menos en `needs`       | `release-ready` rojo (conjunto cerrado)                                    |
| `preview-e2e` en fallo en PR            | Merge **aún posible** si `release-ready` verde y política no exige Preview |
| `preview-e2e` omitido en push a `main`  | Correcto por diseño; no debe hacer fallar `release-ready`                  |
| `release` omitido en PR                 | Correcto; no entra en `REQUIRED_JOBS`                                      |

Evidencia histórica de gate negativo: [evidencia-gate-negativa.md](../cierre/evidencia-gate-negativa.md).

## Decisión pendiente (elegir una — XOR)

El mantenedor debe dejar constancia explícita de **una** de las dos ramas. Hasta
entonces, el repositorio opera con merge técnicamente posible sin `preview-e2e`
verde.

### Opción A — Preview obligatoria en PR (recomendada)

**Política:** No añadir `preview-e2e` a `needs` de `release-ready`. Exigir en todo
PR hacia `main`:

1. Check `release-ready` verde (ya obligatorio en GitHub).
2. Job **`preview-e2e` verde** en el último commit del PR, salvo excepción escrita.
3. Confirmación en panel Vercel de que **no** se exige `preview-e2e` para
   desplegar Preview (evitar ciclo). Si Vercel esperara solo `release-ready`,
   añadir `preview-e2e` a `required_status_checks` de la protección clásica **puede**
   ser viable sin ciclo; hay que verificarlo en el proyecto antes de activarlo.

**Implementación GitHub (cuando el ciclo esté descartado):** añadir contexto
`preview-e2e` junto a `release-ready` en protección clásica, **sin** incluirlo en
`REQUIRED_JOBS`.

**Consecuencia de no hacerlo:** se puede fusionar código no probado en el entorno
Preview/CDN real.

### Opción B — Riesgo residual aceptado (excepción firmada)

**Política:** El merge a `main` puede realizarse con `preview-e2e` rojo, omitido
o sustituido por re-run manual, siempre que `release-ready` esté verde y Nitro
(`fx-e2e` + suite preview en CI) haya pasado.

**Requisitos de la excepción:**

| Campo             | Obligatorio                                                   |
| ----------------- | ------------------------------------------------------------- |
| Propietario       | Persona nombrada (mantenedor)                                 |
| Motivo            | p. ej. rate limit Vercel, Preview caída, urgencia documentada |
| Alcance           | PR o ventana temporal concreta                                |
| Fecha de revisión | Próxima revisión obligatoria (p. ej. ≤ 30 días)               |
| Registro          | Entrada en tabla de excepciones del expediente de aceptación  |

**Consecuencia:** producción puede recibir commits no validados en Preview; la
aceptación humana asume ese hueco.

### Recomendación para el mantenedor

**Adoptar Opción A** como política nominal del proyecto, con verificación única
en Vercel de «Deployment checks» antes de opcionalmente endurecer la protección
clásica con el contexto `preview-e2e`. Mantener **Opción B** solo como tabla de
excepciones firmadas, no como silencio operativo.

No se recomienda incorporar `preview-e2e` dentro de `release-ready` sin prueba
del grafo Vercel.

## Checklist de aceptación de producción

Aplicar cuando exista un **SHA candidato** promovido a producción (típicamente
post-merge en `main` y deploy Vercel). Esta planificación **no** ejecuta deploy
ni rollback; sirve como lista de cierre humano.

| #   | Ítem                                     | Cómo verificar                                                                                      | Evidencia mínima                                                             |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | **SHA / artefacto**                      | `GET /build-manifest.json` en la URL desplegada                                                     | `commit` = SHA candidato; campos de `validateManifestStructure` OK           |
| 2   | **Prod = commit o trazabilidad rebuild** | `POSTDEPLOY_URL=… EXPECTED_COMMIT=… pnpm run test:postdeploy` o `node scripts/postdeploy-check.mjs` | Salida OK o nota de rebuild con `buildId` / `Tested-SHA` del Release         |
| 3   | **Manifiesto y rutas críticas**          | Rutas del manifiesto + home, listados y una ficha por dominio                                       | HTTP 200; sin redirect inesperado al canónico en Preview                     |
| 4   | **Smoke de formularios**                 | `pnpm run smoke`; herramientas (Ohm / Nicokit), comparador, tema claro/oscuro                       | Exit 0 en entorno representativo (prod o Preview aceptada)                   |
| 5   | **Cabeceras y activos**                  | Muestra de cabeceras en prod; política `/catalog` y `/assets` (ver U11B)                            | Registro de muestra o runbook CSP (VAP-27); **NO VERIFICADO** si 403/bloqueo |
| 6   | **Rollback ensayado**                    | Nota en [rollback.md](./rollback.md): Instant Rollback Vercel o `git revert` + CI                   | Fecha, operador y deployment de retorno identificado                         |
| 7   | **Aprobación humana**                    | Firma en [expediente-aceptacion.md](../cierre/expediente-aceptacion.md)                             | Nombre + fecha; excepciones abiertas referenciadas                           |

Comandos útiles (sin ejecutarlos en U-OPS):

```bash
# Identidad tras deploy
POSTDEPLOY_URL=https://vapelog-alexendros.vercel.app \
  EXPECTED_COMMIT=<sha> pnpm run test:postdeploy

# Perfil operador (ítems humanos)
pnpm run harness -- operator
```

## Relación con otros documentos

- Pipeline y checks post-merge: [deploy.md](./deploy.md).
- Rollback: [rollback.md](./rollback.md).
- Gates y alcance: [ADR-0012](../architecture/decisions/ADR-0012-alcance-cierre-y-gates.md).
- Contribución (lista de jobs): [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Excepciones históricas Preview: [expediente-aceptacion.md](../cierre/expediente-aceptacion.md).

## Registro de cambios documentales

| Fecha      | Autor / unidad | Notas                                                               |
| ---------- | -------------- | ------------------------------------------------------------------- |
| 2026-11-10 | U-OPS          | Inspección API rulesets 26288300/26288301; política XOR y checklist |

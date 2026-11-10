# Guía — testing

### Propósito de este documento

- **Objetivos:** Qué y cómo se prueba en Vapelog.
- **Estructura:** Unit → cobertura → smoke → visual.
- **Contenido a integrar según contexto:** Complementa scripts en `package.json`.

## Unitarios

`node:test` con descubrimiento recursivo (`scripts/run-unit-tests.mjs`):

- `src/data/**/*.test.ts`
- `scripts/**/*.test.mjs`

Los tests de componentes con DOM no entran en ese contrato; viven en el runner
de navegador. E2E en `e2e/` (Playwright).

```bash
pnpm test
pnpm run test:coverage
```

Gate CI (Node 22, `scripts/coverage-gate.mjs`): ejecuta los unitarios con
`--experimental-test-coverage`, umbral nativo `--test-coverage-lines=70`,
artefacto **LCOV** en `coverage/lcov.info` y sale distinto de cero si fallan
pruebas, si falta el informe o si el informe está vacío. El universo medible
son `src/data/**/*.ts` y `scripts/**/*.mjs`, con exclusiones de tests y
`*.gen.ts`. Ramas y funciones se registran desde el LCOV del gate. `src/lib/`
importado por tests puede cargarse en ejecución pero el umbral contractual
aplica al universo anterior.

## Smoke

```bash
pnpm run build && pnpm run smoke
```

Arranca `vite preview`, exige HTTP 200 y el marcador `Vapelog` en el body de
`/` y `/dispositivos`.

## Visual (opcional)

`scripts/browser-smoke.mjs` (Playwright) para regresiones visuales desktop/móvil
y ambos temas.

## Humo

El modelo del humo ([ADR-0007](../architecture/decisions/ADR-0007-humo-v2.md))
es **puro y determinista** (`src/lib/smoke/model.ts`, sin DOM), por lo que se
prueba con `node:test` dentro de `pnpm test`:

- `src/data/smoke-model.test.ts` (8 tests): determinismo por semilla, cota de
  alfa acumulada por tema, movimiento perceptible (≥ 15 px/s de ascenso medio),
  rejilla sin NaN ni negativos, FIFO de `emit` (≤ 3 bocanadas), cota de alfa
  con emisiones adversariales, que `emit` no altera el determinismo ambiental y
  que el ASCII solo aparece en la banda baja de densidad.
- `src/data/contrast.test.ts`: contraste de texto ≥ 4,5:1, bordes de control
  ≥ 3:1, kinds ≥ 3:1 en oscuro y ΔE OKLab ≥ 15 (ADR-0016). Sin contrato de
  humo ni `--brut-*`.

## Modelos históricos (tilt / scramble)

Los tests de `kinetic-scramble` y `tilt` pueden permanecer mientras el código
puro exista en el árbol; la UI ya no monta esos efectos (ADR-0016).
`e2e/fx-smoke.spec.ts` exige la **ausencia** de canvas de humo y del
conmutador de efectos.

## E2E contra Preview protegido

El job `preview-e2e` valida el deployment real de Vercel, no el build local. Si
el proyecto tiene Deployment Protection (SSO) sobre Preview, hace falta el
Automation Bypass:

```bash
# Comprobar la configuración sin tocar Vercel
pnpm run check:preview-bypass

# Suite contra un Preview concreto (la cookie se siembra sola)
export VERCEL_AUTOMATION_BYPASS_SECRET=...   # environment Preview en GitHub
export E2E_BASE_URL=https://<preview>.vercel.app
pnpm exec playwright test -c playwright.preview.config.ts
```

- `e2e/preview/global-setup.ts` siembra la cookie de bypass en un contexto de
  API limitado al origen del Preview. El secreto **no** se envía como cabecera
  global: no viaja a terceros del contexto (toolbar `vercel.live`).
- La cookie se guarda en `os.tmpdir()` con permisos `0600` y se borra en
  `global-teardown.ts`.
- Contra Nitro local (`pnpm run e2e`, job `fx-e2e`) no hay bypass: el setup deja
  un estado vacío y no se pide ninguna credencial.
- Alta, verificación y rotación del secreto:
  [runbook VAP-22](../runbooks/vap-22-preview-merge-y-aceptacion-u-ops.md).

## Accesibilidad y e2e

```bash
pnpm run a11y                 # axe serious+critical sobre el build (scripts/a11y-pass.mjs)
pnpm run browser:matrix       # matriz U9 Chromium claro/oscuro × escritorio/móvil (recorridos críticos)
pnpm run firefox:smoke        # humo Firefox en rutas críticas (exit 2 = BLOQUEADO sin motor)
pnpm run visual-smoke         # desbordamiento horizontal por viewport/tema
pnpm run aceptacion:capturas  # PNGs de la matriz de aceptación visual v2
pnpm run e2e                  # build + Nitro loopback + a11y-pass + browser-smoke
```

- `scripts/a11y-pass.mjs` recorre ≥ 5 rutas × 2 temas y sale 0 solo con 0
  violaciones serious/critical.
- `scripts/visual-smoke.mjs` detecta desbordamiento horizontal (p. ej. 360 px).
- `scripts/aceptacion-v2-capturas.mjs` genera evidencias PNG + índice bajo
  `docs/cierre/aceptacion-v2/capturas/` (no marca casillas del expediente).
- `scripts/e2e.sh` es el espejo local del job `browser` de CI y corre en el
  hook `pre-commit` (verificación e2e de husky).

Medición en navegador real (Chromium headless contra el build de producción):

```bash
pnpm run build
pnpm run smoke-bench   # contrato de ausencia de canvas FX (ADR-0016/U5)
```

- `smoke-bench` (`scripts/smoke-bench.mjs`) comprueba que no hay
  `canvas[data-fx]` ni capas de humo, con claves FX antiguas presentes. Es
  informativo en CI (job `smoke-bench`, `continue-on-error: true`). El coste
  por fotograma del canvas ya no aplica: el humo se retiró de la UI.

# Guía — testing

### Propósito de este documento

- **Objetivos:** Qué y cómo se prueba en Vapelog.
- **Estructura:** Unit → cobertura → smoke → visual.
- **Contenido a integrar según contexto:** Complementa scripts en `package.json`.

## Unitarios

`node:test` sobre `src/data/*.test.ts` y `scripts/*.test.mjs`:

```bash
pnpm test
pnpm run test:coverage
```

Umbral CI: **≥ 70 %** de líneas en la fila `all files` que parsea el job
`test` de `.github/workflows/ci.yml` (primera cifra = líneas). El comando
`pnpm run test:coverage` no filtra con `--test-coverage-include`: el
denominador son los módulos cargados por los globs
`src/data/*.test.ts` y `scripts/*.test.mjs` (incluye `src/lib/` importado).
`AGENTS.md` habla de `src/data/` + `scripts/` como ámbito contractual; no
se cambia el runner ni se sube el porcentaje en este cierre.

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

## Accesibilidad y e2e

```bash
pnpm run a11y                 # axe serious+critical sobre el build (scripts/a11y-pass.mjs)
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

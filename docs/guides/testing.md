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

Umbral CI: **≥ 70 %** de líneas en el total reportado.

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
- `src/data/contrast.test.ts`: exigido `K × densidad_máx ≤ --smoke-alpha` en
  Q3/Q2/Q1 (11 semillas × 120 s, margen ≥ 10 %) y el peor caso de lectura con
  solape ASCII (`--smoke-alpha + 0.12`) en claro, oscuro y
  `prefers-contrast: more`.

Medición en navegador real (Chromium headless contra el build de producción):

```bash
pnpm run build
pnpm run smoke-bench   # coste propio del humo (lastFrameCostMs)
pnpm run smoke-verify  # memoria, CLS/LCP y prefers-reduced-motion
```

- `smoke-bench` (`scripts/smoke-bench.mjs`) mide el coste propio por fotograma
  del humo con flags `--seconds/--route/--theme/--width/--dpr/--cpu/--fx/
--reduced-motion`; umbral de referencia ≤ 2 ms de media y ≤ 4 ms p95 (≤ 4 ms
  media con CPU ×4). Es informativo en CI (job `smoke-bench`,
  `continue-on-error: true`).
- `smoke-verify` (`scripts/smoke-verify.mjs`) fuerza GC y comprueba retención
  de memoria (3 muestras a 60 s), CLS ≤ 0.05 y LCP ≤ 2.5 s, y la ausencia de
  rAF del humo con `prefers-reduced-motion`. Números y veredictos de la última
  pasada en [humo-resultados.md](./humo-resultados.md); línea base en
  [humo-baseline.md](./humo-baseline.md).

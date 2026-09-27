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

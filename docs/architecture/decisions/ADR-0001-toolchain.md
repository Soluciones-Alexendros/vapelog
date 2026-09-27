# ADR-0001 — Toolchain TanStack Start / Vite / pnpm

### Propósito de este documento

- **Objetivos:** Registrar la decisión de toolchain de la aplicación.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** No sustituye el README de setup.

## Estado

Aceptado

## Contexto

El workspace original dependía del builder Grok (sin `package.json` versionable).
Hacía falta una toolchain reproducible alineada con repo-standard (scripts
canónicos, Node 22, pnpm).

## Decisión

- **TanStack Start** + Vite + React 19 para SSR y routing.
- **pnpm** como gestor; Node ≥ 22.
- Scripts canónicos: `format:check`, `lint`, `typecheck`, `test`,
  `test:coverage`, `smoke`, `check:env`.
- Artefacto de build en `dist/` (client + server).

## Consecuencias

- CI usa `ubuntu-latest` + pnpm frozen-lockfile.
- Smoke sirve el preview de Vite sobre `dist/`.
- No se reintroduce Nitro/Vercel preset salvo ADR futuro si el adapter cambia.

# Runbook — deploy (Vercel)

### Propósito de este documento

- **Objetivos:** Pasos para publicar una versión en Vercel.
- **Estructura:** Preflight → build → verificación.
- **Contenido a integrar según contexto:** No incluye secretos reales.

## Preflight

1. `main` verde en CI (`quality` → `test` → `build` → `smoke`).
2. Sin variables obligatorias; si se añaden, documentarlas en `.env.example`.

## Deploy

1. Conectar el repo `Soluciones-Alexendros/vapelog` a un proyecto Vercel.
2. Framework preset: Vite / TanStack Start según el dashboard.
3. Build command: `pnpm run build`.
4. Output: `dist` (ajustar si el adapter de Start cambia).

## Verificación

- GET `/` devuelve 200 y muestra «Vapelog».
- Probar una ficha de cada dominio y el toggle de tema.

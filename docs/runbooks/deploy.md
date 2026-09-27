# Runbook — deploy (Vercel)

### Propósito de este documento

- **Objetivos:** Pasos para publicar una versión en Vercel.
- **Estructura:** Preflight → build → verificación.
- **Contenido a integrar según contexto:** No incluye secretos reales.

## Preflight

1. `main` verde en CI (`quality` → `test` → `build` → `smoke`).
2. Sin variables obligatorias; si se añaden, documentarlas en `.env.example`.

## Deploy

1. Conectar el repo `Soluciones-Alexendros/vapelog` a un proyecto Vercel
   (framework **TanStack Start** / Nitro).
2. Install: `pnpm install --frozen-lockfile`.
3. Build: `pnpm run build` (emite `.output/` vía Nitro).
4. Start local de verificación: `pnpm start` → `node .output/server/index.mjs`.

## Verificación

- GET `/` devuelve 200 y muestra «Vapelog».
- Probar una ficha de cada dominio y el toggle de tema.

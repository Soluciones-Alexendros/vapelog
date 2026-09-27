# Runbook — rollback

### Propósito de este documento

- **Objetivos:** Revertir un deploy fallido en Vercel.
- **Estructura:** Señales → acción → verificación.
- **Contenido a integrar según contexto:** Preferir redeploy de commit previo.

## Señales

- Smoke o health fallidos tras un deploy.
- Errores 5xx generalizados en la home o fichas.

## Acción

1. En Vercel: Instant Rollback al deployment anterior estable, **o**
2. `git revert` del commit defectuoso en `main` + push (CI vuelve a desplegar).

## Verificación

- `pnpm run smoke` contra el preview/producción.
- Comprobar tema y una ficha de dispositivo.

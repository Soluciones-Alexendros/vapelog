# Runbook — rotación de secretos

### Propósito de este documento

- **Objetivos:** Procedimiento si se filtra un token relacionado con el proyecto.
- **Estructura:** Alcance → rotación → verificación.
- **Contenido a integrar según contexto:** Hoy la app no exige secretos runtime.

## Alcance actual

Vapelog no usa variables obligatorias en runtime. Posibles secretos externos:

- Token de GitHub (CI, Renovate, `gh`)
- Token de Vercel / cuenta de despliegue
- Hostinger u otros paneles si se usan para DNS

## Rotación

1. Revocar el token comprometido en el proveedor.
2. Emitir uno nuevo con el mínimo privilegio.
3. Actualizar secretos de GitHub Actions / Vercel / máquina local.
4. Auditar commits e historial por filtraciones; rotar de nuevo si hace falta.

## Verificación

- CI verde con el nuevo secreto.
- Deploy de prueba sin errores de autenticación del proveedor.

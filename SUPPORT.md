# Soporte — Vapelog

### Propósito de este documento

- **Objetivos:** Señalar canales de soporte y los runbooks vivos sin
  sustituir su contenido operativo.
- **Estructura:** Contacto → antes de reportar → tabla de runbooks → guías.
- **Contenido a integrar según contexto:** No reescribas los runbooks ni
  cambies los canales. Si un incidente tiene receta, enlázala.

## Canales de contacto

- **Ops / incidentes:** consultar primero los runbooks de [docs/runbooks/](docs/runbooks/).
- **Desarrollo:** leer [docs/README.md](docs/README.md) y [AGENTS.md](AGENTS.md) antes de abrir un PR.
- **Mantenedor:** `@Alexendros` en GitHub.

## Antes de reportar un bug

1. Reproducir en local con `make validate` (o lint + test + build + smoke).
2. Comprobar si ya existe un issue en GitHub.
3. Si es un incidente de producción, seguir el runbook adecuado.

## Runbooks

| Escenario            | Runbook                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Desplegar en Vercel  | [docs/runbooks/deploy.md](docs/runbooks/deploy.md)                 |
| Revertir un deploy   | [docs/runbooks/rollback.md](docs/runbooks/rollback.md)             |
| Rotación de secretos | [docs/runbooks/rotate-secrets.md](docs/runbooks/rotate-secrets.md) |

## Stack y entorno

- Node.js 22.x (ver `engines` en [package.json](package.json)).
- TanStack Start, React, TypeScript, Tailwind v4.
- Comandos principales en [README.md](README.md).

## Reportar problemas de seguridad

No abrir un issue público. Seguir [SECURITY.md](SECURITY.md).

# Documentación — Vapelog

### Propósito de este documento

- **Objetivos:** Índice de la documentación del repositorio.
- **Estructura:** Arquitectura → guías → runbooks.
- **Contenido a integrar según contexto:** Enlaza; no dupliques README.

## Arquitectura

- [overview.md](architecture/overview.md)
- [decisions/](architecture/decisions/)

## Guías

- [local-setup.md](guides/local-setup.md)
- [coding-standards.md](guides/coding-standards.md)
- [testing.md](guides/testing.md)

## Runbooks

- [deploy.md](runbooks/deploy.md)
- [rollback.md](runbooks/rollback.md)
- [rotate-secrets.md](runbooks/rotate-secrets.md)

## Cierre / aceptación

- [cierre/](cierre/) — plan maestro, matriz, expediente y evidencias.
- [cierre/aceptacion-v2-visual.md](cierre/aceptacion-v2-visual.md) —
  expediente de la migración visual v2 (ADR-0017 / U1–U9).
- [cierre/aceptacion-v2/capturas/](cierre/aceptacion-v2/capturas/) — PNGs e
  índice (`pnpm run aceptacion:capturas`).
- El informe baseline F00 (2026-10-17, app 0.12.0) está **obsoleto** como
  fotografía actual; usar HEAD de `main` y el expediente v2.

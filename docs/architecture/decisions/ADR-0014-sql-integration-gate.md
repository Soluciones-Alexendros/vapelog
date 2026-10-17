# ADR-0014 — SQL en el gate de publicación

### Propósito de este documento

- **Objetivos:** Incluir instalación real del esquema objetivo en CI.
- **Estructura:** Estado → decisión → consecuencias.
- **Contenido a integrar según contexto:** ADR-0012, `ci.yml`, `scripts/sql-install.mjs`.

## Estado

Aceptado (2026-10-17) — PR-F.

## Decisión

1. El esquema en `public/vapelog-esquema.sql` **no** es runtime de la app.
2. El job `sql-integration` aplica el DDL en Postgres 16 efímero con
   `ON_ERROR_STOP` y fixtures negativos de unicidad/FK.
3. `release-ready` depende de `sql-integration`.
4. Sin `DATABASE_URL` en CI el contrato de tests falla; en local el skip es
   explícito (no `assert.ok(true)`).

## Consecuencias

- Hay que mantener el SQL alineado con TypeScript (OBJ-019).
- No se introduce persistencia runtime sin ADR adicional.

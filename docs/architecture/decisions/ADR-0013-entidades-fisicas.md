# ADR-0013 — Entidades físicas y kits unknown

### Propósito de este documento

- **Objetivos:** Discriminar cartucho/cabezal y kit unknown vs vacío.
- **Estructura:** Estado → decisión → consecuencias.
- **Contenido a integrar según contexto:** `src/data/entities.ts`, ADR-0011.

## Estado

Aceptado (2026-10-17) — PR-C.

## Decisión

1. Familia `tanque` no se reclasifica por `build: "capsula"` legado.
2. Familia `capsula` / pod: cartucho con calefactor embebido; sin `integratedCoilId` autorreferente.
3. Kit sin inventario editorial: `status: "unknown"`, no listas vacías «confirmadas».
4. TPD de producto: agregado de variantes; conflictos → `parcial`.

## Consecuencias

- `SCHEMA_VERSION` 1.4.0; `CATALOG_REVISION` 2026-10-17.entidades-fisicas.

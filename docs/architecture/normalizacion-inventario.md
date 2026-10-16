# Inventario de normalización del catálogo

### Propósito de este documento

- **Objetivos:** Inventariar entidades, consumidores e IDs estables durante
  la migración de normalización (ADR-0011).
- **Estructura:** Versiones → entidades → consumidores → tabla de IDs →
  cambios de comportamiento.
- **Contenido a integrar según contexto:** Actualizar la tabla de IDs cuando
  un PR renombre o parta una ficha.

## Versiones

| Constante          | Valor actual     | Significado                             |
| ------------------ | ---------------- | --------------------------------------- |
| `SCHEMA_VERSION`   | `1.1.0`          | Contrato TypeScript y reglas de dominio |
| `CATALOG_REVISION` | `2026-10-16.pr1` | Contenido del catálogo en archivos      |

## Entidades actuales (fase 1)

| Dominio                     | Responsabilidad                   | Archivos principales         |
| --------------------------- | --------------------------------- | ---------------------------- |
| `device`                    | Mods y kits                       | `catalog.ts`, `devices*.ts`  |
| `coil`                      | Resistencias, cápsulas, cabezales | `heads.ts`, `catalog.ts`     |
| `liquid`                    | Producto + `variations[]`         | `liquids-*.ts`, `catalog.ts` |
| `part`                      | Accesorios                        | `catalog.ts`                 |
| `platform`                  | Agrupación comercial              | `catalog.ts`                 |
| `taxon` / `genre` / `brand` | Taxonomías y marcas               | `catalog.ts`                 |

Proyecciones de navegación: `/dispositivos`, `/resistencias`, `/liquidos`,
`/componentes`.

## Consumidores de reglas críticas

| Función / predicado              | Consumidores                               |
| -------------------------------- | ------------------------------------------ |
| `recommendLiquids`               | `compat-lab.tsx`, `sheets.tsx`             |
| `recommendedPowerForOhms`        | `tools-panel.tsx`                          |
| `powerNotes`                     | `tools-panel.tsx`                          |
| `mixNicotine` / `shotsForTarget` | `tools-panel.tsx`, `sheets.tsx`            |
| `matches` / `query`              | rutas de archivo, facetas, command palette |
| `compatibility`                  | `compat-lab.tsx`, fichas                   |

## Tabla de correspondencia de IDs (fase 1)

En el PR 1 **ningún** id ni slug público cambia. Alias futuros se añaden aquí.

| ID / slug actual                         | Entidad futura                                           | Notas                                |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------ |
| `herrera-abarra-freebase`                | Producto líquido                                         | Variantes 0–18 mg/ml                 |
| `herrera-abarra-aroma` (y siblings)      | Producto aroma                                           | `genreId: aroma` → fit `preparacion` |
| `herrera-abarra-reserva-*`               | Variante / línea Reserva                                 | Atributo estructurado en fase 2      |
| Dominios `device`/`coil`/`liquid`/`part` | Device, Atomizer, Cartridge, CoilHead, Accessory, Liquid | Fase 4                               |

## Cambios de comportamiento (PR 1)

1. Concentrados (`aroma`) → estado `preparacion`, nunca `directo`.
2. Potencia por Ω → lista de resistencias con su propio rango; sin
   autocompletado del punto medio.
3. `powerNotes` → dentro / fuera / desconocido por dimensión.
4. Regla 12 mg/ml + calada → retirada (registro editorial).
5. Filtro «sin nicotina» → existe variante conocida a cero; AND con ratio
   en la misma variante; `matchingVariantIds` en el resultado de match.
6. Nicokit → `initialZeroMgMl`; objetivo 0 mg válido; overflow en
   alternativas.

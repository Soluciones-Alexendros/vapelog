# ADR-0011 — Normalización del dominio del catálogo

### Propósito de este documento

- **Objetivos:** Fijar el contrato de normalización del catálogo: versiones,
  entidades actuales, cambios de comportamiento y secuencia de migración.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** `SCHEMA_VERSION` /
  `CATALOG_REVISION` en `src/data/types.ts`, inventario en
  [normalizacion-inventario.md](../normalizacion-inventario.md).

## Estado

Aceptado (2026-10-16) — fase de correcciones urgentes (PR 1). Las fases
posteriores (líquidos, entidades físicas, taxonomías, SQL, servidor)
ampliarán este ADR o abrirán ADRs hijos.

## Contexto

El catálogo en TypeScript y el esquema SQL objetivo divergían en semántica:
concentrados clasificados como listos para vapear, potencia agregada por
ohmiaje, filtro «sin nicotina» que excluye productos con variante a 0 mg/ml,
desconocidos tratados como cero o como «dentro de la ventana», y predicados
de variante independientes que admiten cruces imposibles.

## Decisión

1. **Versiones.** `SCHEMA_VERSION` versiona el contrato; `CATALOG_REVISION`
   versiona el contenido. Ambas viven en `src/data/types.ts`.
2. **Entidades en esta fase.** Siguen siendo `device`, `coil`, `liquid` y
   `part`. Los IDs y slugs públicos no cambian en el PR 1.
3. **Recomendaciones.** Un `genreId: "aroma"` no se clasifica como listo
   para uso directo; el estado `preparacion` es distinto del encaje de
   calada. La potencia por ohmios se presenta como referencias individuales,
   sin rango agregado ni autocompletado. La regla editorial de umbral fijo
   12 mg/ml + calada queda retirada y registrada.
4. **Desconocidos.** Sin límites publicados no se afirma «dentro de la
   ventana». Una concentración ausente no se interpreta como cero.
5. **Filtros.** Nicotina y ratio se evalúan en la misma variante. «Sin
   nicotina» exige una variante conocida a cero. Los desconocidos no entran
   en «con» ni en «sin».
6. **Nicokit.** Alcance acotado a líquido inicial a 0 mg; el parámetro
   interno se llama `initialZeroMgMl`. Objetivo cero es un caso válido.
7. **Volúmenes en conflicto (Herrera 60 ml).** Documentado; la separación
   `fillVolumeMl` / `containerCapacityMl` llega en la fase de líquidos. No
   se elige una cifra silenciosamente.

### Resultados exigidos (regresiones)

| Caso                                        | Resultado                                        |
| ------------------------------------------- | ------------------------------------------------ |
| Abarra aroma + resistencia MTL              | No se clasifica como listo (`preparacion`)       |
| Abarra freebase + filtro «sin nicotina»     | Devuelve el producto y la variante 0 mg/ml       |
| Longfill 10 ml en envase 30/120             | Contenido y capacidad separados (fase 2)         |
| Dispositivo sin límites publicados          | Evaluación eléctrica desconocida                 |
| Igual ohmiaje en resistencias distintas     | Referencias individuales, sin potencia universal |
| Filtros satisfechos por variantes distintas | El producto no aparece                           |
| Concentración desconocida                   | No se representa como cero                       |
| Herrera 60 ml                               | Conflicto documentado, sin cifra única           |

## Consecuencias

- Las pruebas de `logic.test.ts` y `search.test.ts` reescriben expectativas
  que afirmaban el umbral de 12 mg y el rango agregado.
- La UI de laboratorio, fichas y herramientas adapta etiquetas y deja de
  autocompletar potencia desde el punto medio.
- Las fases siguientes migran volúmenes, entidades físicas, taxonomías,
  compatibilidad versionada, SQL y capa de lectura sin cambiar de stack.

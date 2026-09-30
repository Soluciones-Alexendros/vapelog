# ADR-0006 — Campos estructurados en lugar de frases crudas

### Propósito de este documento

- **Objetivos:** Registrar la eliminación de los campos de texto libre del catálogo y su sustitución por campos estructurados.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Ninguno; documento cerrado.

## Estado

Aceptado

## Contexto

Las fichas derivaban sus datos de frases comprimidas de producto (`battery`, `charge`, `power`, `capacity`, `dimensions`, `weight`, `display` en `Device`; `wire`, `build`, `pack` en `Coil`) mediante parsers en `measures.ts`, y las mostraban tal cual en filas `*_note` de la ficha. Esas frases eran nombres de producto del sitio web con los datos comprimidos, no datos a conservar. Los parsers fallaban en casos reales (p. ej. `2×2200 mAh integrada (4400 mAh)` devolvía `null` en capacidad) y las filas `*_note` duplicaban información ya derivada.

## Decisión

- `Device` pierde `battery`, `charge`, `power`, `capacity`, `dimensions`, `weight` y `display` (texto libre) y gana campos estructurados: `batteryKind`, `batteryMah`, `cellCount`, `cellType`, `chargePort`, `chargeAmps`, `chargeVolts`, `capacityMl`, `capacityTpdMl`, `heightMm`, `widthMm`, `depthMm`, `weightG`, `displayKind`, `displaySizeIn` (`materials` y `airflow` quedan como texto conciso o `null`; `chipset`, `modes`, `powerMinW/MaxW` y `ohmMin/Max` se conservan).
- `Coil` pierde `wire`, `build` y `pack` y gana `wireKind` (`malla` | `doble-malla` | `alambre`), `wireMaterial`, `build` (`malla` | `doble-malla` | `capsula`) y `packCount`.
- Se eliminan las filas `*_note` de `spec-def.ts` (`charge_note`, `power_note`, `capacity_note`, `wire_note`, `pack_note`); `charge_port` se sustituye por `charge_rate` (texto compuesto) y se añade `capacity_tpd_ml`.
- Se eliminan los parsers de `measures.ts` salvo `publishedText`, `ratioParts`, `ohmBands` y `powerBands`; nuevo helper `powerSummary(device)` en `specs.ts`.
- `Part.spec`, `Part.quantityNote` y `Liquid.line` se conservan (técnicos concisos y taxonomía, respectivamente). `Part` admite `dripMm`, `chemistry` y `continuousAmps` opcionales; las filas de ficha `drip_mm`, `chemistry` y `amps` leen esos campos.
- Donde la fuente oficial no publica el dato, el campo queda en `null` y la ficha muestra `Sin dato publicado` (sin inventar datos, según AGENTS.md §9).

## Consecuencias

- La plantilla `public/vapelog-esquema.sql` refleja el nuevo modelo (columnas y filas `spec_def`).
- Los datos pendientes se completan desde fuentes oficiales; los huecos documentados quedan en `null` hasta una futura pasada de curaduría.

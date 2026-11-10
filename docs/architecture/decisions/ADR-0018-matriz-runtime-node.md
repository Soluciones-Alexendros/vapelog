# ADR-0018 — Matriz de runtime Node (CI, producción y tipos)

### Propósito de este documento

- **Objetivos:** Fijar la matriz explícita de versiones de Node soportadas
  para gates, despliegue y desarrollo; complementa [ADR-0001](./ADR-0001-toolchain.md).
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Evidencia de U11A (U-ENV); no
  sustituye el README de setup.

## Estado

Aceptado (2026-11-10) — U11A.

## Contexto

[ADR-0001](./ADR-0001-toolchain.md) declara Node ≥ 22 sin distinguir CI,
producción ni alineación de `@types/node`. En el repo: `.nvmrc` fija la
línea mayor **22**; `package.json` mantiene `engines.node` `>=22`; CI usa
`node-version-file: ".nvmrc"`; los tests de aceptación del baseline se
validaron en Node **v22.23.4**. La dependencia `lint-staged` exige
`engines.node` `>=22.22.1` en el lockfile. El proyecto Vercel **vapelog**
configura `nodeVersion` en la línea **24.x**. `@types/node` sigue en
`^26.6.3`, por encima de cualquier runtime acordado.

Había riesgo de asumir una sola versión (p. ej. bajar tipos a 22 sin
auditar APIs) o de tratar producción en 24 como no soportada sin contrato.

## Decisión

1. **Gate canónico (CI y referencia local).** Permanece la línea **Node
   22.x**, anclada por `.nvmrc` (major 22). Los jobs de GitHub Actions no
   cambian de estrategia en este ADR. Desarrollo y `make validate` deben
   reproducir ese gate salvo prueba documentada en otro entorno de la
   matriz.
2. **Parche mínimo práctico.** Para hooks y toolchain que declaran
   `>=22.22.1`, el entorno local/CI debe usar un patch **≥ 22.22.1** dentro
   de la línea 22 (p. ej. 22.23.4 validado). No se endurece `engines` en
   `package.json` en este corte: `>=22` sigue siendo el contrato publicado.
3. **Producción (Vercel).** **Node 24.x** queda reconocida como runtime
   **soportado** dentro de la matriz, alineada con la configuración actual
   del proyecto. La unificación (misma versión en CI y producción, o job
   duplicado en 24) queda **pendiente de alineación** en un corte posterior;
   hasta entonces CI sigue siendo la fuente de verdad de los gates.
4. **Tipos TypeScript (`@types/node`).** **Sin cambio** en este ADR: se
   mantiene `^26` en `package.json`. La alineación de tipos con la menor
   versión de la matriz (22 / 24) queda **diferida** hasta una auditoría
   de APIs de Node usadas en `src/` y `scripts/`, para evitar regresiones
   por downgrade ciego o tipos que no cubran el runtime de producción.

### Matriz resumida

| Rol                         | Versión Node         | Contrato en repo           |
| --------------------------- | -------------------- | -------------------------- |
| CI / gates                  | 22.x (`.nvmrc`)      | Canónico                   |
| Local recomendado           | 22.x, patch ≥22.22.1 | Misma línea que CI         |
| Producción Vercel (vapelog) | 24.x                 | Soportado; alinear después |
| Tipos (`@types/node`)       | ^26 (sin cambio)     | Diferido (auditoría API)   |

## Consecuencias

- No se modifica `package.json` ni `.nvmrc` en U11A: solo contrato
  documental.
- Quien despliegue asume compatibilidad del artefacto con Node 24 en
  Vercel; la evidencia verde sigue saliendo de Node 22 en CI.
- Un futuro ADR o PR puede: añadir matrix 24 en CI, fijar patch en
  `.nvmrc`, o bajar/subir `@types/node` tras la auditoría citada.
- VAP-24 (reproducibilidad) pasa de «parcial» a «matriz explícita» a
  efectos de planificación; la alineación completa sigue en backlog.

# Expediente de aceptación — candidata de producción

### Propósito de este documento

- **Objetivos:** Registro OBJ-029 del cierre F02–F10.
- **Estructura:** Alcance → evidencias → excepciones → decisión.
- **Contenido a integrar según contexto:** matriz-trazabilidad.csv, PRs B–J.

## Estado

EN REVISIÓN — rellenado al cerrar PR-J; la autorización formal requiere
revisores reales identificados.

## Alcance congelado

Catálogo de referencia (archivos), comparación, compatibilidad, calculadoras,
contenido publicado. Fuera: auth, pagos, BD runtime, comunidad (ADR-0012).

## Evidencias por fase

| Fase    | PR          | Resultado                                        |
| ------- | ----------- | ------------------------------------------------ |
| F00–F01 | #17         | Gates, manifiesto, supply-chain                  |
| F02     | #18         | Compatibilidad canónica                          |
| F03–F05 | #19 (+ #20) | Entidades, validador, evidencia, repositorio     |
| F06–F10 | PR-F–J      | SQL CI, UI, headers, postdeploy, este expediente |

## Excepciones abiertas

| Ítem                     | Riesgo                  | Mitigación                                                          | Responsable | Vencimiento / cierre                                      |
| ------------------------ | ----------------------- | ------------------------------------------------------------------- | ----------- | --------------------------------------------------------- |
| CSP en Report-Only       | Política aún no enforce | Observar violaciones; **no** enforce a ciegas                       | Operador    | Fecha que fije el operador tras evidencia en Preview/prod |
| E2E Firefox/WebKit en CI | Tiempo de runner        | Chromium es el gate (`fx-e2e` + suite preview en Nitro)             | Operador    | Hasta ampliar `E2E_ALL_BROWSERS=1` con ADR                |
| Preview rate limit       | Sin Preview Ready       | `preview-e2e` fuera de `release-ready`; re-run cuando Vercel acepte | Operador    | Cuando el límite caduque                                  |
| SHA prod / VAL-001-03    | Identidad despliegue    | `pnpm run test:postdeploy` / `pnpm run harness deployed`            | Operador    | Tras deploy del candidato con manifiesto                  |
| Método de merge          | Solo squash en el repo  | Conservar squash (flota) o habilitar merge commits conscientemente  | Operador    | Antes del merge del PR de cierre                          |

## Presupuestos no funcionales (propuestos)

Ver plan maestro §12. Ratificados aquí como objetivos iniciales; medición
completa en F08 con entorno reproducible.

## Decisión

- [ ] Sin P0/P1 bloqueantes abiertos
- [ ] Matriz VAL críticos CONFORME o excepción firmada
- [ ] Postdeploy SHA coherente
- [ ] Rollback ensayado / runbook actualizado
- [ ] Autorización: _____________ fecha: _____________

Ventana de observación propuesta: 24–48 h tras promoción.

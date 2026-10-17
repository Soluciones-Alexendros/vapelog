---
title: "VapeLog — Plan maestro de cierre de producción"
document_version: "1.0"
created_at: "2026-10-17"
repository: "Soluciones-Alexendros/vapelog"
baseline_version: "0.12.0"
baseline_commit: "48d5359cba7430667af092d838c1be18c90e7e2a"
status: "PLAN PROPUESTO; NO EJECUTADO"
language: "es"
---

# VapeLog — Plan maestro de cierre de producción

## 1. Resumen y uso del documento

Objetivo: finalizar el catálogo publicado con datos coherentes, reglas correctas, frontend integrado, pruebas reales, seguridad proporcional y entrega recuperable. Este archivo es un plan de trabajo, no un certificado de producción ni evidencia de tests superados.

Línea base confirmada nuevamente en GitHub: 0.12.0, commit `48d5359cba7430667af092d838c1be18c90e7e2a`. El análisis detallado procede de las inspecciones de este mismo SHA en la conversación. La documentación de TanStack Start se ha vuelto a consultar mediante Context7 para aislamiento de servidor y validación. No se ha ejecutado el repositorio, Postgres, Playwright, benchmarks o scanners durante la preparación del archivo; tampoco se han consultado resultados de Actions ni identificado el SHA servido por Vercel.

Cada objetivo tiene prioridad, requisito, evidencias internas E##, dependencias, tareas, pruebas VAL, resultado y entregables. Los E## son identificadores propios de trazabilidad del documento, no citas automáticas de una plataforma. Las pruebas VAL son especificaciones a implementar/ejecutar; su existencia en el plan no acredita que existan ya en el repositorio.

El CSV adjunto contiene una fila por validación y permite registrar ejecución, commit, evidencia y decisión. El Markdown es el documento normativo del plan; el CSV es su matriz de seguimiento.

## 2. Alcance y reglas de ejecución

Incluye catálogo, variantes, fichas, búsqueda/facetas, archivo, comparación, compatibilidad, calculadoras, contenido publicado, SQL distribuido como soportado, CI, seguridad, SEO, caché y operación. Mantener el stack y los datos en archivos durante la estabilización salvo decisión técnica documentada. No se exige BD en runtime, autenticación, pagos, tienda o comunidad.

Reglas:

- No reescribir para cumplir nombres de carpetas. Priorizar corrección, integración y evidencia.
- No inventar especificaciones comerciales, contenido de kits, fuentes, certeza o cumplimiento legal.
- No confundir unknown con cero, false, lista vacía, incompatibilidad o no aplicable.
- No repetir como abiertos defectos históricos ya corregidos: protegerlos con regresión.
- No usar tests que siempre pasan, skips silenciosos, regex sobre mensajes o snapshots aislados como sustitutos de pruebas funcionales.
- No exponer credenciales, ni hacer pruebas destructivas o de carga en terceros. Infraestructura de ensayo aislada.
- Toda creación de PR, modificación de repositorio, publicación o despliegue requiere autorización aparte. Este entregable no ejecuta ninguna de esas acciones.
- Dependencias indican prerrequisitos lógicos; pueden adelantarse fixtures y tests rojos. Los P0 independientes se trabajan en paralelo.
- La atribución de responsables es por rol propuesto; no asigna personas reales.

## 3. Severidad, estados y cierres

P0: bloquea una candidata afectada por fallo de reglas críticas, publicación sin checks o falta de identidad/remediación urgente. P1: obligatorio antes de declarar completo el ámbito publicado. P2: mejora con presupuesto y decisión explícita; el resultado de rendimiento debe aceptarse antes del cierre, aunque no exija optimización si cumple.

Estados: PROPUESTO → EN IMPLEMENTACIÓN → IMPLEMENTADO SIN VALIDAR → VALIDADO → ACEPTADO. Alternativas: BLOQUEADO o EXCLUIDO POR ADR. Un estado NO VERIFICADO no significa fallo ni éxito. Excluir una capacidad exige retirarla de promesas/UI/documentación, no esconder un defecto existente.

Cierre de un objetivo: PR/commit + test ejecutado + resultado esperado + artefacto de evidencia + revisor. Cierre de fase: todos sus objetivos aceptados, sin bloqueadores y con revisión de integración. Una excepción debe incluir riesgo, ámbito, mitigación, responsable y vencimiento; ningún P0/P1 funcional publicado queda exento por defecto.

## 4. Hallazgos confirmados y pendientes de comprobación

Confirmados por código: release no depende de todos los jobs; prueba SQL no instala; evaluador reconstruye dimensiones del legado/textos; proyecciones físicas incompletas; meets con evidencia unverified; validador parcial; repositorio ignora ordenación y expone referencias mutables. El workflow Security inspeccionado solo ejecuta actionlint.

Pendiente: versiones transitivas/artifactos, Actions ejecutados, protecciones de rama, configuración real de Vercel, cabeceras reales, rendimiento, accesibilidad manual, legalidad aplicable y SHA público. La portada se recuperó previamente; fallos al recuperar otras URLs o www no prueban caída. El cambio de dependencias declarado no prueba por sí solo remediación en producción.

## 5. Registro de evidencia de línea base

| ID  | Origen                           | Archivo o referencia                                                                                                              | Hecho / ámbito                                                                                           | Límite                                                                                                    |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| E01 | GitHub: línea base               | `package.json; último commit consultado`                                                                                          | 0.12.0; 48d5359cba7430667af092d838c1be18c90e7e2a                                                         | Consulta actual; no identifica por sí misma el despliegue.                                                |
| E02 | GitHub: entrega                  | `.github/workflows/ci.yml`                                                                                                        | release depende de smoke y browser; no de test ni fx-e2e.                                                | Código inspeccionado en la revisión previa, mismo SHA.                                                    |
| E03 | GitHub: SQL                      | `scripts/sql-schema-install.test.mjs`                                                                                             | La prueba no conecta ni ejecuta SQL; solo comprueba presencia/formato de DATABASE_URL.                   | Código inspeccionado; no se ejecutó Postgres.                                                             |
| E04 | GitHub: compatibilidad           | `src/data/compat-evaluation.ts; src/data/logic.ts`                                                                                | El evaluador nuevo deriva dimensiones del legado y de regex sobre razones.                               | Inspección estática; casos negativos deben ejecutarse.                                                    |
| E05 | GitHub: entidades                | `src/data/entities.ts`                                                                                                            | Proyecciones inferidas; kits con listas vacías; TPD tomado de primera variante.                          | Inspección estática; no equivale a modelo canónico completado.                                            |
| E06 | GitHub: evidencia                | `src/data/evidence.ts`                                                                                                            | El adaptador puede producir meets con verification unverified; FieldEvidence no contiene sourceId.       | Inspección estática; no se ha validado cumplimiento legal.                                                |
| E07 | GitHub: integridad               | `src/data/validate-catalog.ts`                                                                                                    | Existen controles, pero faltan referencias, unicidades e invariantes señaladas en el plan.               | No se ha ejecutado el validador ni contado incidencias.                                                   |
| E08 | GitHub: consultas                | `src/data/repository.ts`                                                                                                          | list no ordena por search.orden; expone objetos/mapas originales; límite sin finitud/integridad.         | Contrato interno; no se ha demostrado exposición remota.                                                  |
| E09 | GitHub: seguridad                | `.github/workflows/security.yml; vercel.json`                                                                                     | Workflow security ejecuta actionlint; vercel.json define caché y redirección, no política HTTP completa. | Ajustes externos y cabeceras reales pendientes de verificación.                                           |
| E10 | GitHub: dominio y regresión      | `src/data/types.ts; search.ts; specs.ts; spec-def.ts; logic.test.ts; search.test.ts; specs.test.ts; liquids-herrera.ts; heads.ts` | Contratos y casos de las auditorías anteriores; parte corregida en 0.12.0.                               | No reintroducir errores históricos como si todos siguieran abiertos.                                      |
| E11 | Web publicada                    | `Portada pública recuperada en la revisión previa`                                                                                | Contenido recuperado no acredita SHA; www y otras rutas no pudieron recuperarse.                         | No prueba caída, vulnerabilidad, versión antigua ni estado visual completo.                               |
| E12 | Context7: TanStack Start         | `/websites/tanstack_start_framework_react; consultas de documentación`                                                            | Esquemas compartidos, wrappers de funciones y módulos exclusivos de servidor.                            | Consulta actual; contrastar API con dependencias instaladas; un validador identidad no valida en runtime. |
| E13 | Documentación pública: seguridad | `TanStack/router advisory GHSA-qx66-fv34-fjm8; OWASP CSP y HTTP Headers`                                                          | Actualizar paquetes afectados y redeplegar; gestionar CSP y cabeceras verificadas.                       | No se afirma que el despliegue actual sea explotable; verificar lockfile y artefacto.                     |
| E14 | Documentación pública: pruebas   | `Playwright: Best Practices; Retries`                                                                                             | Pruebas aisladas, trazas para diagnóstico y reintentos sin ocultar inestabilidad.                        | Recomendación documental; no demuestra resultados del proyecto.                                           |

## 6. Arquitectura y contratos de destino

Flujo: datos editoriales → esquema/validación referencial → modelo de dominio canónico → consultas/evaluaciones → DTO → presentación. La presentación no decide reglas ni reconstruye magnitudes desde textos.

Entidades: Device, Atomizer, Cartridge, CoilHead, Accessory, Liquid; presentación y contenido de kit diferenciados de identidad técnica. Un calefactor integrado puede ser estructura embebida si no tiene identidad comercial independiente. No generar entidades vacías por completar el modelo.

Convenciones: camelCase en TypeScript, snake_case en SQL con mapeo explícito; unidades en nombres cuando sean magnitudes; IDs estables separados de slug, interfaz de puerto y alias. Rangos se validan por extremos conocidos; las capacidades desconocidas no se rellenan con defaults editoriales.

Datos críticos: nicotina, contenido/envase/preparación, resistencia, potencia, interfaz, componentes y requisitos de mercado. Evidencia por afirmación con sourceId, localizador, fecha y naturaleza. Estados editoriales no se confunden con ciclo de vida comercial ni tipo de fuente.

TanStack: esquemas compartidos seguros para cliente; wrappers de funciones servidor; módulos exclusivos de servidor protegidos conforme a versión instalada. Un callback que devuelve data sin parsear no es validación runtime. No se obliga a mover consultas al servidor sin motivo o medición.

## 7. Mapa de fases

| Fase | Nombre                                          | Prerrequisitos               | Responsable propuesto                 | Resultado de fase                                                                         |
| ---- | ----------------------------------------------- | ---------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| F00  | Línea base, alcance y trazabilidad              | Ninguno                      | QA + mantenimiento                    | Snapshot e inventario aprobados, resultados iniciales reales y registro de evidencias.    |
| F01  | Cadena de publicación y seguridad inmediata     | F00                          | DevOps + seguridad                    | Ningún fallo obligatorio permite publicar; artefacto y despliegue identificables.         |
| F02  | Compatibilidad y recomendaciones deterministas  | F00                          | Dominio + QA                          | Evaluación estructurada independiente del legado, sin conclusiones por ausencia de datos. |
| F03  | Entidades, composición, variantes y taxonomías  | F00, F02                     | Dominio + contenido                   | Modelo canónico y migración conservadora con referencias resolubles y URLs compatibles.   |
| F04  | Evidencia y validación integral                 | F03                          | Dominio + contenido + QA              | Integridad bloqueante y afirmaciones críticas trazables, sin aumentar certeza al migrar.  |
| F05  | Repositorio y fronteras cliente-servidor        | F03, F04                     | Backend + frontend                    | Un contrato de consulta, límites validados y ausencia de mutación accidental.             |
| F06  | SQL objetivo y pruebas de integración           | F03, F04                     | Backend + QA                          | DDL y restricciones ejecutados en Postgres temporal; alcance de persistencia documentado. |
| F07  | Frontend integrado, accesibilidad y contenido   | F02, F03, F04, F05           | Frontend + UX + contenido             | Recorridos consumen contratos nuevos y contenido publicable sin bloqueos de interacción.  |
| F08  | Validación transversal, seguridad y rendimiento | F01, F02, F04, F05, F06, F07 | QA + seguridad                        | Suite funcional y no funcional ejecutada sobre artefacto candidato con evidencias.        |
| F09  | Despliegue, monitorización y recuperación       | F01, F08                     | DevOps + mantenimiento                | Promoción trazable, comprobación externa y rollback ensayado.                             |
| F10  | Candidata y autorización de producción          | F09                          | Responsable de producto + QA + DevOps | Expediente de aceptación aprobado y sin bloqueadores abiertos.                            |

## 8. Objetivos, tareas y validaciones

### F00 — Línea base, alcance y trazabilidad

Responsable propuesto: QA + mantenimiento. Dependencias de fase: ninguna.

Resultado esperado de fase: Snapshot e inventario aprobados, resultados iniciales reales y registro de evidencias.

#### OBJ-001 — Fijar baseline y ejecutar diagnóstico inicial

- Prioridad: P0.
- Estado inicial: Inspección realizada; ejecución y despliegue NO VERIFICADOS.
- Evidencia: E01, E02, E11.
- Dependencias: ninguna.
- Requisito: No confundir inspección, pruebas ejecutadas y estado desplegado.

Implementación:

- [ ] OBJ-001-T01: Fijar SHA, lockfile, Node y pnpm; registrar entorno y configuración sin secretos.
- [ ] OBJ-001-T02: Inventariar rutas, scripts, workflows, consumidores de datos y capacidades declaradas como soportadas.
- [ ] OBJ-001-T03: Ejecutar comandos actuales en checkout limpio; registrar resultados y fallos sin corregirlos silenciosamente.
- [ ] OBJ-001-T04: Obtener identidad del despliegue y protecciones de rama; si no hay acceso, dejar estado NO VERIFICADO.

Validación:

| Test       | Escenario / acción                       | Resultado esperado                                                            |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| VAL-001-01 | Checkout limpio e instalación congelada  | Instalación reproducible o fallo registrado con log.                          |
| VAL-001-02 | Inventario vs scripts y rutas existentes | Cada capacidad tiene responsable de comprobación; ningún resultado se supone. |
| VAL-001-03 | Comparar SHA de candidato y despliegue   | Coincidencia acreditada o desalineación registrada, nunca inferida del copy.  |

Resultado del objetivo: Baseline reproducible y listado de fallos reales; ausencia de evidencia visible.

Entregables/evidencia de cierre: Informe inicial, inventario de capacidades y manifiesto de versión.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-002 — Establecer trazabilidad y control de alcance

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E01.
- Dependencias: OBJ-001.
- Requisito: Toda tarea ejecutada debe conservar vínculo con necesidad, commit, test y aceptación.

Implementación:

- [ ] OBJ-002-T01: Adoptar IDs del presente plan; vincularlos en PR y resultados.
- [ ] OBJ-002-T02: Separar corrección, verificación pendiente y mejora de diseño.
- [ ] OBJ-002-T03: Congelar alcance de la candidata: catálogo, comparación, compatibilidad, calculadoras y contenido publicado.
- [ ] OBJ-002-T04: Registrar ADR de decisiones; no añadir cuentas, pagos, base de datos runtime o comunidad como requisitos implícitos.

Validación:

| Test       | Escenario / acción               | Resultado esperado                                                            |
| ---------- | -------------------------------- | ----------------------------------------------------------------------------- |
| VAL-002-01 | Revisión de una PR de muestra    | Incluye objetivos, tests, cambios de datos y evidencia de aceptación.         |
| VAL-002-02 | Revisión del registro de alcance | Toda exclusión está justificada; no elimina defectos de funciones publicadas. |

Resultado del objetivo: No existen tareas cerradas solo por la presencia de un archivo o una interfaz.

Entregables/evidencia de cierre: Registro de seguimiento y plantilla de PR/aceptación.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F01 — Cadena de publicación y seguridad inmediata

Responsable propuesto: DevOps + seguridad. Dependencias de fase: F00.

Resultado esperado de fase: Ningún fallo obligatorio permite publicar; artefacto y despliegue identificables.

#### OBJ-003 — Cerrar el grafo de gates de publicación

- Prioridad: P0.
- Estado inicial: Defecto confirmado en needs de release.
- Evidencia: E02.
- Dependencias: OBJ-001.
- Requisito: Publicación y promoción no pueden adelantarse a un check obligatorio fallido, cancelado u omitido.

Implementación:

- [ ] OBJ-003-T01: Crear release-ready con dependencias explícitas de quality, test, build, smoke, E2E y seguridad obligatoria.
- [ ] OBJ-003-T02: Añadir integración SQL cuando el esquema se declare instalable; marcar dependencias opcionales solo mediante ADR de alcance.
- [ ] OBJ-003-T03: Hacer depender release del agregador; comprobar main protegida y merge/auto-merge.
- [ ] OBJ-003-T04: Conectar política de Vercel con el candidato probado; separar release de despliegue.

Validación:

| Test       | Escenario / acción                                      | Resultado esperado                                                         |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| VAL-003-01 | Introducir fallo unitario controlado en rama de pruebas | No se crea release ni se promueve candidato.                               |
| VAL-003-02 | Fallo/cancelación de E2E o seguridad                    | Gate no pasa; omission inesperada no cuenta como éxito.                    |
| VAL-003-03 | Pipeline satisfactorio                                  | Solo el SHA probado queda autorizado; ensayo sin efectos sobre producción. |

Resultado del objetivo: No se publica un build con tests pendientes o fallidos.

Entregables/evidencia de cierre: Workflow actualizado y evidencia de ensayos negativos.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-004 — Identificar artefacto, versión y procedencia

- Prioridad: P0.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E01, E02, E11.
- Dependencias: OBJ-001.
- Requisito: El artefacto probado y el publicado deben ser identificables y correlacionables.

Implementación:

- [ ] OBJ-004-T01: Generar manifiesto con commit, versión, schemaVersion, catalogRevision, lockfile hash y build ID.
- [ ] OBJ-004-T02: Probar y promover el mismo artefacto; si Vercel reconstruye, documentar y verificar reproducibilidad y SHA.
- [ ] OBJ-004-T03: Evitar que el commit automático de versión se confunda con el código efectivamente probado.
- [ ] OBJ-004-T04: Exponer identidad pública mínima sin secretos y añadirla a logs.

Validación:

| Test       | Escenario / acción                            | Resultado esperado                                         |
| ---------- | --------------------------------------------- | ---------------------------------------------------------- |
| VAL-004-01 | Consultar manifiesto del candidato y servidor | Identidad verificable y consistente.                       |
| VAL-004-02 | Modificar contenido o lockfile                | Hash/revisión cambian; no se reutiliza identidad obsoleta. |
| VAL-004-03 | Promover artefacto incorrecto en ensayo       | Verificación posterior rechaza discrepancia.               |

Resultado del objetivo: Trazabilidad desde una respuesta pública hasta el código y las pruebas.

Entregables/evidencia de cierre: Manifiesto y comprobador postdeploy.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-005 — Verificar vulnerabilidades y cadena de suministro

- Prioridad: P0.
- Estado inicial: Remediación declarada; lockfile/artefacto/despliegue pendientes de comprobar.
- Evidencia: E09, E13.
- Dependencias: OBJ-001.
- Requisito: Las versiones declaradas no bastan para acreditar que la remediación llegó a producción.

Implementación:

- [ ] OBJ-005-T01: Contrastar advisory oficial con versiones directas y transitivas del lockfile y artefacto.
- [ ] OBJ-005-T02: Auditar dependencias de producción y build; documentar aplicabilidad, no solo conteo bruto.
- [ ] OBJ-005-T03: Añadir chequeos en PR y periódicos, detección de secretos y análisis estático apropiado.
- [ ] OBJ-005-T04: Revisar descarga/ejecución de actionlint; fijar versión e integridad o alternativa controlada. Mantener acciones por SHA.

Validación:

| Test       | Escenario / acción                               | Resultado esperado                                                |
| ---------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| VAL-005-01 | Fixture o rama con dependencia afectada conocida | Gate detecta rango vulnerable sin explotar servicios reales.      |
| VAL-005-02 | Credencial sintética de prueba                   | Scanner la identifica; no se usan secretos reales.                |
| VAL-005-03 | Inspección de lockfile y artefacto               | Se documenta remediación o excepción con responsable y caducidad. |

Resultado del objetivo: Sin riesgo alto/crítico aplicable sin remediación o aceptación explícita aprobada.

Entregables/evidencia de cierre: Reporte de seguridad, inventario de versiones y registro de excepciones.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F02 — Compatibilidad y recomendaciones deterministas

Responsable propuesto: Dominio + QA. Dependencias de fase: F00.

Resultado esperado de fase: Evaluación estructurada independiente del legado, sin conclusiones por ausencia de datos.

#### OBJ-006 — Calcular compatibilidad por dimensiones independientes

- Prioridad: P0.
- Estado inicial: Defecto confirmado: derivación del legado y regex.
- Evidencia: E04.
- Dependencias: OBJ-001.
- Requisito: La lógica nueva será canónica; los mensajes y CompatKind legado no decidirán el resultado.

Implementación:

- [ ] OBJ-006-T01: Implementar física, potencia, resistencia y condiciones como evaluaciones estructuradas.
- [ ] OBJ-006-T02: Distinguir match, mismatch, unknown, conditional y not_applicable con reglas documentadas.
- [ ] OBJ-006-T03: Derivar adaptador legacy desde el resultado nuevo; eliminar parsing de mensajes.
- [ ] OBJ-006-T04: Conservar límites parciales y justificación por comprobación; nunca elevar ausencia de choque a certeza global.

Validación:

| Test       | Escenario / acción                          | Resultado esperado                                                  |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------- |
| VAL-006-01 | Encaje válido y potencia incompatible       | Física match; eléctrica mismatch, no dos rechazos físicos.          |
| VAL-006-02 | Sin límites y con un único extremo conocido | Unknown/partial según contrato; nunca match global injustificado.   |
| VAL-006-03 | Cambiar texto o idioma de razones           | Resultado idéntico.                                                 |
| VAL-006-04 | Excepción y evidencia incompleta            | Se conserva motivo y no se fabrica compatibilidad/incompatibilidad. |

Resultado del objetivo: Dimensiones reproducibles, independientes y explicables.

Entregables/evidencia de cierre: Motor canónico, adaptador y fixtures de reglas.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-007 — Cerrar recomendaciones de líquidos y potencia

- Prioridad: P0.
- Estado inicial: Correcciones anteriores implementadas; regresión pendiente de ejecución.
- Evidencia: E04, E10.
- Dependencias: OBJ-006.
- Requisito: No reintroducir regresiones históricas ni presentar inferencias como recomendaciones universales.

Implementación:

- [ ] OBJ-007-T01: Verificar conservación de exclusión de concentrados y rangos por referencia concreta.
- [ ] OBJ-007-T02: Prohibir autoajuste de potencia basado solo en ohmiaje agregado.
- [ ] OBJ-007-T03: Separar preparación necesaria, encaje técnico e incertidumbre.
- [ ] OBJ-007-T04: Mantener reglas de nicotina explícitas, limitadas y documentadas; no inventar umbrales clínicos.

Validación:

| Test       | Escenario / acción                             | Resultado esperado                                         |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------- |
| VAL-007-01 | Aroma Herrera + resistencia MTL rellenable     | Nunca listo para uso directo.                              |
| VAL-007-02 | Dos coils con igual ohmiaje y rangos distintos | No se ofrece media ni intervalo universal.                 |
| VAL-007-03 | Datos de nicotina/ratio desconocidos           | Se expresa incertidumbre; no se presume cero o adecuación. |
| VAL-007-04 | Consumidores de laboratorio y ficha            | Mismo resultado de dominio en ambos.                       |

Resultado del objetivo: Recomendaciones ligadas a producto/variante y no a coincidencias superficiales.

Entregables/evidencia de cierre: Tests de regresión y contrato de recomendación.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-008 — Validar calculadoras y semántica de resultados

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E10.
- Dependencias: OBJ-001.
- Requisito: Los cálculos respetan unidades, dominio de entrada y significado de salida.

Implementación:

- [ ] OBJ-008-T01: Mantener nicokit limitado explícitamente a líquido inicial a 0 mg; renombrar entradas internas ambiguas.
- [ ] OBJ-008-T02: Validar vacíos, coma decimal, finitud, negativos, cero y extremos; detectar overflow de resultados numéricos.
- [ ] OBJ-008-T03: Distinguir hueco inicial y restante; revisar alternativas de objetivo y capacidad.
- [ ] OBJ-008-T04: Separar corriente de salida de la coil de corriente de batería; no presentar ley de Ohm como validación de seguridad de celda.

Validación:

| Test       | Escenario / acción                                        | Resultado esperado                                                                           |
| ---------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| VAL-008-01 | 50 ml iniciales + 10 ml a 20 mg/ml                        | 60 ml finales y 3,333... mg/ml antes del redondeo de presentación.                           |
| VAL-008-02 | Objetivo cero, capacidad insuficiente y valores inválidos | Resultado o error específico definido; no NaN/Infinity ni sugerencia que desborda sin aviso. |
| VAL-008-03 | Identidades de Ohm y conversiones                         | Consistencia dentro de tolerancia declarada y sin redondeo prematuro.                        |

Resultado del objetivo: Resultados matemáticos correctos y límites de interpretación explícitos.

Entregables/evidencia de cierre: Matriz de entradas, tolerancias y pruebas unitarias/E2E.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F03 — Entidades, composición, variantes y taxonomías

Responsable propuesto: Dominio + contenido. Dependencias de fase: F00, F02.

Resultado esperado de fase: Modelo canónico y migración conservadora con referencias resolubles y URLs compatibles.

#### OBJ-009 — Hacer canónicas las entidades físicas y sus interfaces

- Prioridad: P0.
- Estado inicial: Proyecciones actuales incompletas; errores estáticos confirmados.
- Evidencia: E05, E10.
- Dependencias: OBJ-006.
- Requisito: Cartucho, resistencia y atomizador se distinguen mediante datos explícitos, no heurísticas del legado.

Implementación:

- [ ] OBJ-009-T01: Definir discriminantes de Cartridge/CoilHead y calefactor integrado o reemplazable.
- [ ] OBJ-009-T02: Separar identidad de interfaz compartida, puerto y propietario.
- [ ] OBJ-009-T03: Resolver o embeber calefactores integrados sin autorreferencias ficticias.
- [ ] OBJ-009-T04: Migrar projectCoil/projectPart a adaptadores conservadores y retirar inferencias de build/spec cuando exista dato explícito.

Validación:

| Test       | Escenario / acción                                          | Resultado esperado                                                           |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| VAL-009-01 | Cápsula integrada con construcción malla                    | No se interpreta como resistencia reemplazable.                              |
| VAL-009-02 | Cabezal cuyo build legado dice capsula                      | Clasificación depende del objeto real y evidencia, no de esa cadena aislada. |
| VAL-009-03 | Interfaces compatibles y dominios distintos con texto igual | Solo conexiones tipadas válidas son candidatas.                              |
| VAL-009-04 | Recorrido de referencias integradas                         | Toda referencia existe; sin ciclos físicos inválidos.                        |

Resultado del objetivo: El modelo describe la pieza y sus conexiones sin reinterpretaciones contradictorias.

Entregables/evidencia de cierre: Schemas canónicos, adaptadores e informe de migración.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-010 — Representar kits, variantes y presentaciones reales

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E05.
- Dependencias: OBJ-009.
- Requisito: Un kit no se equipara al dispositivo ni a una lista de familias compatibles.

Implementación:

- [ ] OBJ-010-T01: Modelar contenido documentado por presentación/mercado; distinguir desconocido de conjunto vacío confirmado.
- [ ] OBJ-010-T02: Referenciar atomizador, cartucho, coil y accesorios incluidos.
- [ ] OBJ-010-T03: Identificar cantidades y diferencias técnicas; no inventar componentes para completar campos.
- [ ] OBJ-010-T04: Derivar rutas de compatibilidad desde componentes identificados.

Validación:

| Test       | Escenario / acción                   | Resultado esperado                                                                     |
| ---------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| VAL-010-01 | Mismo mod vendido solo y en dos kits | Tres presentaciones distinguibles sin cambiar la identidad técnica injustificadamente. |
| VAL-010-02 | Kit sin documentación de contenido   | Estado unknown; no lista vacía interpretada como comprobada.                           |
| VAL-010-03 | ID inexistente o cantidad inválida   | Validador bloquea publicación.                                                         |

Resultado del objetivo: Composición trazable y rutas de montaje explícitas.

Entregables/evidencia de cierre: Presentaciones migradas y fixtures de ensamblaje.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-011 — Normalizar líquidos, volúmenes, nicotina y recetas

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E05, E10.
- Dependencias: OBJ-009.
- Requisito: Contenido vendido, capacidad del envase y preparación final son magnitudes distintas.

Implementación:

- [ ] OBJ-011-T01: Verificar migración fillVolumeMl/containerCapacityMl/preparedVolumeMl con desconocidos y conflictos.
- [ ] OBJ-011-T02: Consolidar nicotineMgPerMl y ratio numérico de base definida; no convertir null en cero.
- [ ] OBJ-011-T03: Separar composición del producto de receta final; no sumar porcentajes de bases incompatibles.
- [ ] OBJ-011-T04: Eliminar representación de producto desde primera variante o máxima nicotina; usar agregados o selección explícita.

Validación:

| Test       | Escenario / acción                                  | Resultado esperado                                                            |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| VAL-011-01 | Longfill descrito como 10 ml en envase de 30/120 ml | Contenido y capacidad distintos; volumen final solo según receta.             |
| VAL-011-02 | Formato de 60 ml con fuentes contradictorias        | Conflicto conservado; no cifra elegida silenciosamente.                       |
| VAL-011-03 | Reordenar variantes                                 | No cambia cumplimiento, resumen o representación general de forma accidental. |
| VAL-011-04 | Ratio 70 VG / 30 PG y nicotina desconocida          | Orden inequívoco y estado desconocido preservado.                             |

Resultado del objetivo: Ninguna calculadora o filtro recibe envase como contenido ni supuesto como hecho.

Entregables/evidencia de cierre: Datos migrados, decisiones editoriales y tests.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-012 — Normalizar taxonomías y especificaciones ortogonales

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E05, E07, E10.
- Dependencias: OBJ-009.
- Requisito: Cada clasificación responde a un eje; la navegación no limita el modelo físico.

Implementación:

- [ ] OBJ-012-T01: Separar forma, suministro, batería, activación, modos, control e interfaz.
- [ ] OBJ-012-T02: Separar tecnología de pantalla, interacción/resolución y calefactor/material/número de elementos.
- [ ] OBJ-012-T03: Separar notas aromáticas y atributos sensoriales como frescor; derivar ancestros.
- [ ] OBJ-012-T04: Definir alias/deprecaciones, política de tags y cambios de IDs estables.

Validación:

| Test       | Escenario / acción                          | Resultado esperado                                                 |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------ |
| VAL-012-01 | Activación por calada/botón y modos VW/TC   | Ejes distintos sin pérdida de capacidades.                         |
| VAL-012-02 | Triple/cuádruple malla y nombre tecnológico | No se reduce a malla simple ni se guarda tecnología como material. |
| VAL-012-03 | Taxón de dominio ajeno o padre incorrecto   | Se rechaza.                                                        |
| VAL-012-04 | Alias antiguo y ancestros                   | Resolución estable y sin duplicación artificial de recuentos.      |

Resultado del objetivo: Taxonomías coherentes y extensibles sin jerarquías de criterios mezclados.

Entregables/evidencia de cierre: Diccionarios, mapeo de alias y pruebas de taxonomía.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F04 — Evidencia y validación integral

Responsable propuesto: Dominio + contenido + QA. Dependencias de fase: F03.

Resultado esperado de fase: Integridad bloqueante y afirmaciones críticas trazables, sin aumentar certeza al migrar.

#### OBJ-013 — Completar integridad estructural y referencial

- Prioridad: P0.
- Estado inicial: Validador existente parcial.
- Evidencia: E07.
- Dependencias: OBJ-009, OBJ-010, OBJ-011, OBJ-012.
- Requisito: Un error estructural bloquea el catálogo independientemente de que la UI lo disimule.

Implementación:

- [ ] OBJ-013-T01: Validar snapshots inyectables en vez de depender solo de imports globales.
- [ ] OBJ-013-T02: Cubrir unicidad de IDs, archiveId, slugs por ámbito, variantes, marcas, interfaces y taxones.
- [ ] OBJ-013-T03: Validar dominios/parentesco, sabores/géneros, plataformas de accesorios, kits y toda referencia.
- [ ] OBJ-013-T04: Validar finitud, positividad, rangos, capacidades y coherencia de desconocidos; regex editoriales solo como advertencia.

Validación:

| Test       | Escenario / acción                                             | Resultado esperado                                               |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| VAL-013-01 | Fixture negativo por cada invariante                           | Código de error estable, ubicación precisa y severidad correcta. |
| VAL-013-02 | Mutar un catálogo válido con FK rota/duplicado/rango invertido | CI falla por la causa esperada.                                  |
| VAL-013-03 | Snapshot válido y advertencias aceptadas                       | Cero errores; advertencias con decisión y responsable.           |

Resultado del objetivo: Los tests demuestran capacidad de detección, no solo ausencia de incidencias en datos actuales.

Entregables/evidencia de cierre: Validador puro, corpus válido/inválido e informe de integridad.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-014 — Vincular afirmaciones a fuentes y requisitos verificables

- Prioridad: P0.
- Estado inicial: Adaptador actual produce meets con evidencia unverified.
- Evidencia: E06.
- Dependencias: OBJ-011, OBJ-013.
- Requisito: La migración no puede aumentar la certeza de un dato heredado.

Implementación:

- [ ] OBJ-014-T01: Añadir sourceId resoluble, localizador, fecha y naturaleza del dato por afirmación crítica.
- [ ] OBJ-014-T02: Distinguir declaración, verificación, conflicto y caducidad.
- [ ] OBJ-014-T03: No mapear TPD si a meets sin comprobar requisitos; conservar declaración heredada por separado.
- [ ] OBJ-014-T04: Definir requisito, producto/variante, mercado y vigencia; revisión legal especializada cuando corresponda.

Validación:

| Test       | Escenario / acción                                          | Resultado esperado                                               |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| VAL-014-01 | TPD heredado si sin evidencia verificada                    | Declaración unverified; no cumplimiento comprobado.              |
| VAL-014-02 | Fuente rota, fecha inválida o campo verificado sin respaldo | Error o bloqueo editorial según política de criticidad.          |
| VAL-014-03 | Dos fuentes contradictorias                                 | Conflicto conservado y visible; ninguna gana por orden de array. |

Resultado del objetivo: Evidencia navegable y certeza honesta por campo/requisito.

Entregables/evidencia de cierre: Registro de fuentes y política de publicación de datos críticos.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F05 — Repositorio y fronteras cliente-servidor

Responsable propuesto: Backend + frontend. Dependencias de fase: F03, F04.

Resultado esperado de fase: Un contrato de consulta, límites validados y ausencia de mutación accidental.

#### OBJ-015 — Garantizar filtros de variantes y facetas coherentes

- Prioridad: P1.
- Estado inicial: Cambios previos presentes; integración completa a verificar.
- Evidencia: E08, E10.
- Dependencias: OBJ-011, OBJ-013.
- Requisito: Los filtros de variante deben cumplirse en una misma variante y justificar el resultado.

Implementación:

- [ ] OBJ-015-T01: Unificar matchesProduct/matchesVariant/matchingVariantIds y uso en ficha/lista.
- [ ] OBJ-015-T02: Definir con/sin/desconocido y TPD de variante sin depender de leadVariation.
- [ ] OBJ-015-T03: Calcular facetas con exactamente la misma semántica.
- [ ] OBJ-015-T04: Normalizar decimales y etiquetas VG/PG sin filtrar sobre textos formateados.

Validación:

| Test       | Escenario / acción                                            | Resultado esperado                                     |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| VAL-015-01 | Abarra freebase con variantes cero y positivas + sin nicotina | Devuelve producto y variante cero.                     |
| VAL-015-02 | Con nicotina 50/50 y sin nicotina 70/30 + con nicotina 70/30  | No coincide si ninguna variante cumple ambas.          |
| VAL-015-03 | Recuento de faceta vs consulta equivalente                    | Coinciden y matchingVariantIds explica cada resultado. |

Resultado del objetivo: Sin resultados fantasma por combinar variantes distintas.

Entregables/evidencia de cierre: Contrato de filtros y pruebas de facetas.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-016 — Cerrar ordenación, paginación y mutabilidad del repositorio

- Prioridad: P1.
- Estado inicial: Defectos estáticos confirmados en repositorio.
- Evidencia: E08.
- Dependencias: OBJ-013, OBJ-015.
- Requisito: Un repositorio de lectura no expone estado global modificable ni ignora la consulta solicitada.

Implementación:

- [ ] OBJ-016-T01: Ordenar antes de paginar, con desempate estable; devolver total y siguiente página/cursor.
- [ ] OBJ-016-T02: Validar limit finito entero y rango; definir rechazo/canonicalización de entradas inválidas.
- [ ] OBJ-016-T03: No devolver mapas cacheados u objetos fuente mutables a consumidores.
- [ ] OBJ-016-T04: Sustituir unknown[] y definir DTO de lista, ficha y evaluación.

Validación:

| Test       | Escenario / acción                                  | Resultado esperado                                             |
| ---------- | --------------------------------------------------- | -------------------------------------------------------------- |
| VAL-016-01 | Orden nombre/marca/vatios y dos páginas con empates | Orden correcto y sin pérdidas/duplicados.                      |
| VAL-016-02 | NaN, Infinity, negativos y decimales                | Contrato consistente; no listas vacías accidentales por slice. |
| VAL-016-03 | Intentar mutar resultado o índice devuelto          | No cambia una consulta posterior ni el catálogo compartido.    |

Resultado del objetivo: Resultados estables e independientes de consumidores.

Entregables/evidencia de cierre: Repositorio tipado y pruebas de contrato.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-017 — Separar dominio, presentación y fronteras servidor

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E08, E12.
- Dependencias: OBJ-016.
- Requisito: La lógica pura no depende de componentes; las fronteras externas validan datos realmente.

Implementación:

- [ ] OBJ-017-T01: Mover formato compartido fuera de components y separar valores de etiquetas.
- [ ] OBJ-017-T02: Inventariar imports directos del catálogo; unificar recorridos o documentar excepciones.
- [ ] OBJ-017-T03: Proteger código exclusivo servidor mediante mecanismo soportado por la versión instalada.
- [ ] OBJ-017-T04: Usar parse/schemas en entrada; una función identidad tipada no valida; no añadir peticiones remotas sin razón medida.

Validación:

| Test       | Escenario / acción                                          | Resultado esperado                                           |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| VAL-017-01 | Importación cliente de módulo protegido en fixture de build | Falla build o protección configurada.                        |
| VAL-017-02 | Entrada manipulada a frontera pública existente             | Se rechaza antes de lógica de dominio, sin stack o secretos. |
| VAL-017-03 | Cambiar idioma de presentación                              | Resultados, filtros y orden numérico no cambian.             |

Resultado del objetivo: Capas desacopladas y límites verificables sin migración forzada del almacenamiento.

Entregables/evidencia de cierre: Mapa de imports, validadores y pruebas de frontera.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F06 — SQL objetivo y pruebas de integración

Responsable propuesto: Backend + QA. Dependencias de fase: F03, F04.

Resultado esperado de fase: DDL y restricciones ejecutados en Postgres temporal; alcance de persistencia documentado.

#### OBJ-018 — Ejecutar instalación SQL y restricciones en Postgres real

- Prioridad: P1.
- Estado inicial: Prueba actual no ejecuta SQL.
- Evidencia: E03.
- Dependencias: OBJ-013.
- Requisito: Un test de integración debe ejecutar el sistema que afirma comprobar.

Implementación:

- [ ] OBJ-018-T01: Crear servicio Postgres temporal de versión soportada; instalar extensiones necesarias.
- [ ] OBJ-018-T02: Ejecutar DDL con parada ante error y pruebas transaccionales.
- [ ] OBJ-018-T03: Rechazar falta de DATABASE_URL en job obligatorio; marcar skip explícito solo en entorno local no obligatorio.
- [ ] OBJ-018-T04: Mantener verificaciones regex únicamente como tests auxiliares.

Validación:

| Test       | Escenario / acción                        | Resultado esperado                                       |
| ---------- | ----------------------------------------- | -------------------------------------------------------- |
| VAL-018-01 | Base vacía + DDL                          | Instalación real termina correctamente; se guardan logs. |
| VAL-018-02 | Fixture que viola FK, unicidad o CHECK    | Postgres rechaza cada caso con error esperado.           |
| VAL-018-03 | Base inaccesible o variable ausente en CI | Job falla; nunca assert.ok(true) como sustituto.         |

Resultado del objetivo: Esquema objetivo realmente instalable y restricciones demostradas.

Entregables/evidencia de cierre: Job sql-integration, fixtures y logs.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-019 — Alinear persistencia, versiones y lógica duplicada

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E03, E10.
- Dependencias: OBJ-018, OBJ-014, OBJ-016.
- Requisito: TypeScript y SQL comparten semántica; las columnas críticas no tienen segunda escritura divergente.

Implementación:

- [ ] OBJ-019-T01: Inventariar correspondencia de campos, nulos, unidades, enums y referencias.
- [ ] OBJ-019-T02: Elegir fuente de verdad para columnas tipadas y proyecciones item_spec.
- [ ] OBJ-019-T03: Probar evolución desde esquema previo y documentar reversibilidad/no reversibilidad.
- [ ] OBJ-019-T04: Ejecutar mismos fixtures de compatibilidad en TS/SQL si ambas implementaciones siguen soportadas; si no, retirar o marcar alcance.

Validación:

| Test       | Escenario / acción                          | Resultado esperado                                         |
| ---------- | ------------------------------------------- | ---------------------------------------------------------- |
| VAL-019-01 | Round-trip de datos representativos         | Se conserva identidad, desconocidos, evidencia y unidades. |
| VAL-019-02 | Mismos fixtures en motores soportados       | Resultado estructurado equivalente.                        |
| VAL-019-03 | Migración y recuperación en base desechable | Sin pérdidas silenciosas; diferencias documentadas.        |

Resultado del objetivo: SQL deja de ser un contrato divergente del runtime.

Entregables/evidencia de cierre: Matriz de campos, migraciones y pruebas de paridad.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F07 — Frontend integrado, accesibilidad y contenido

Responsable propuesto: Frontend + UX + contenido. Dependencias de fase: F02, F03, F04, F05.

Resultado esperado de fase: Recorridos consumen contratos nuevos y contenido publicable sin bloqueos de interacción.

#### OBJ-020 — Integrar contratos nuevos en todos los recorridos

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E04, E05, E08, E10.
- Dependencias: OBJ-006, OBJ-007, OBJ-015, OBJ-016, OBJ-017.
- Requisito: Los módulos nuevos tienen que alimentar la aplicación, no solo sus tests aislados.

Implementación:

- [ ] OBJ-020-T01: Inventariar lista, búsqueda, ficha, archivo, comparación, laboratorio y calculadoras.
- [ ] OBJ-020-T02: Migrar cada consumidor al servicio canónico y conservar adaptadores solo en frontera definida.
- [ ] OBJ-020-T03: Mostrar variantes coincidentes, incertidumbre y condiciones de montaje.
- [ ] OBJ-020-T04: Verificar todas las rutas antiguas/aliases y selecciones guardadas.

Validación:

| Test       | Escenario / acción                            | Resultado esperado                                      |
| ---------- | --------------------------------------------- | ------------------------------------------------------- |
| VAL-020-01 | Mismo caso en ficha, comparador y laboratorio | Mismo resultado y revisión; no lógica local divergente. |
| VAL-020-02 | Recarga y URL compartida con filtros          | Se conserva selección y variante explicativa.           |
| VAL-020-03 | Estado local antiguo o slug deprecado         | Migración o descarte informado sin crash.               |

Resultado del objetivo: No hay lógica crítica nueva sin uso ni consumidores críticos anclados inadvertidamente al legado.

Entregables/evidencia de cierre: Matriz consumidor-servicio y E2E de integración.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-021 — Cerrar robustez de interacción y accesibilidad

- Prioridad: P1.
- Estado inicial: Correcciones de shell previas; regresión pendiente de ejecución.
- Evidencia: E10, E14.
- Dependencias: OBJ-020.
- Requisito: Las correcciones previas del shell deben quedar demostradas y no degradarse con los cambios de datos.

Implementación:

- [ ] OBJ-021-T01: Probar almacenamiento denegado/corrupto, restauración SSR, confirmación de categoría y altura real del dock.
- [ ] OBJ-021-T02: Asegurar foco no invasivo, teclado, diálogos y controles accesibles.
- [ ] OBJ-021-T03: Evitar que cabecera/dock tapen foco; contemplar safe-area y teclado virtual.
- [ ] OBJ-021-T04: Comprobar claro/oscuro, zoom y preferencias de movimiento/contraste.

Validación:

| Test       | Escenario / acción                        | Resultado esperado                                          |
| ---------- | ----------------------------------------- | ----------------------------------------------------------- |
| VAL-021-01 | sessionStorage/localStorage lanzan error  | El catálogo sigue utilizable sin persistencia.              |
| VAL-021-02 | Comparador lleno en móvil y zoom 200/400% | Controles y foco alcanzables, sin contenido crítico tapado. |
| VAL-021-03 | Navegación teclado y lector de pantalla   | Orden, nombres, estados y retorno de foco correctos.        |
| VAL-021-04 | Recarga con selección guardada            | Sin errores de hidratación ni sustitución silenciosa.       |

Resultado del objetivo: Recorridos accesibles y robustos, no únicamente cero alertas automatizadas.

Entregables/evidencia de cierre: Informe manual + automatizado con dispositivos/entornos.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-022 — Cerrar contenido editorial, legal y confianza

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E06, E11.
- Dependencias: OBJ-014, OBJ-020.
- Requisito: La versión pública debe distinguir contenido real, incertidumbre y material demostrativo.

Implementación:

- [ ] OBJ-022-T01: Retirar o excluir de producción artículos de ejemplo y notas internas de monetización/desarrollo.
- [ ] OBJ-022-T02: Revisar fichas publicables, fuentes, estado de revisión y derechos de imágenes.
- [ ] OBJ-022-T03: Implementar canal de corrección con contexto de ficha/variante y gestión responsable.
- [ ] OBJ-022-T04: Inventariar datos personales, logs, formularios y proveedores; resolver información legal/privacidad con revisión aplicable. No añadir banner por inercia.

Validación:

| Test       | Escenario / acción                          | Resultado esperado                                                              |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| VAL-022-01 | Recorrido de contenido publicado            | Sin ejemplo presentado como editorial real ni afirmaciones no respaldadas.      |
| VAL-022-02 | Enviar corrección sintética                 | Incluye entidad, campo y revisión; llega al canal previsto sin datos excesivos. |
| VAL-022-03 | Revisión de derechos y tratamiento de datos | Registro de decisiones y textos publicados; no certificación legal automática.  |

Resultado del objetivo: Contenido coherente con catálogo de referencia para adultos, no tienda ni consejo sanitario.

Entregables/evidencia de cierre: Checklist editorial, registro de derechos y decisiones legales.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F08 — Validación transversal, seguridad y rendimiento

Responsable propuesto: QA + seguridad. Dependencias de fase: F01, F02, F04, F05, F06, F07.

Resultado esperado de fase: Suite funcional y no funcional ejecutada sobre artefacto candidato con evidencias.

#### OBJ-023 — Ejecutar suite funcional y SSR multibrowser

- Prioridad: P0.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E02, E14.
- Dependencias: OBJ-020, OBJ-021.
- Requisito: Probar el artefacto candidato con recorridos completos y evidencia reutilizable.

Implementación:

- [ ] OBJ-023-T01: Definir proyectos Chromium, Firefox y WebKit; desktop y móvil para recorridos críticos.
- [ ] OBJ-023-T02: Capturar errores inesperados de consola/página, red y respuestas fallidas.
- [ ] OBJ-023-T03: Aislar fixtures y almacenamiento; evitar dependencias de orden.
- [ ] OBJ-023-T04: Conservar trazas/reportes al fallar; reintentos no cuentan como solución a flakiness.

Validación:

| Test       | Escenario / acción                                        | Resultado esperado                                        |
| ---------- | --------------------------------------------------------- | --------------------------------------------------------- |
| VAL-023-01 | Buscar-filtrar-abrir-comparar-volver                      | Datos y estado coherentes en todos los motores definidos. |
| VAL-023-02 | Compatibilidad y calculadoras con casos válidos/negativos | Resultados esperados, sin errores inesperados.            |
| VAL-023-03 | Entrada directa, refresh, atrás/adelante y URL inválida   | SSR/hidratación correctos; errores HTTP y UX adecuados.   |

Resultado del objetivo: Cobertura demostrada del producto publicado, no solo de decoraciones y helpers.

Entregables/evidencia de cierre: Reporte E2E, matriz de navegadores y trazas.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-024 — Seguridad HTTP, errores e inputs hostiles

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E09, E12, E13.
- Dependencias: OBJ-005, OBJ-017, OBJ-020.
- Requisito: Endurecimiento debe comprobarse en respuestas reales sin romper SSR.

Implementación:

- [ ] OBJ-024-T01: Definir CSP compatible con arranque/hidratación; observar antes de exigir, con plazo de cierre.
- [ ] OBJ-024-T02: Comprobar frame-ancestors, nosniff, referrer y permisos según necesidades; decidir HSTS en dominio gestionado.
- [ ] OBJ-024-T03: Evitar stacks, variables o secretos en errores públicos; sanitizar salidas y limitar entradas.
- [ ] OBJ-024-T04: Probar URLs, parámetros e identificadores manipulados en entorno propio autorizado.

Validación:

| Test       | Escenario / acción                                       | Resultado esperado                                         |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| VAL-024-01 | Cabeceras en 200/404/500 y rutas/funciones existentes    | Política consistente; sin depender solo de vercel.json.    |
| VAL-024-02 | Payloads sintéticos de HTML/script y parámetros extremos | No ejecución ni fuga; rechazo controlado.                  |
| VAL-024-03 | CSP aplicada + suite SSR/E2E                             | No rompe scripts legítimos, fuentes, imágenes ni diálogos. |

Resultado del objetivo: Sin hallazgos altos/críticos aplicables abiertos ni CSP que inutilice la aplicación.

Entregables/evidencia de cierre: Informe de cabeceras y tests de seguridad autorizados.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-025 — SEO, HTTP, imágenes y caché correctos

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E09, E11.
- Dependencias: OBJ-020, OBJ-022.
- Requisito: URLs y recursos deben poder actualizarse y representar correctamente el catálogo.

Implementación:

- [ ] OBJ-025-T01: Verificar canonical, robots, sitemap, metadatos y 404 reales.
- [ ] OBJ-025-T02: Comprobar www, dominio principal, aliases y redirecciones sin ciclos.
- [ ] OBJ-025-T03: No usar immutable para recursos mutables con misma URL; versionar por contenido o ajustar TTL.
- [ ] OBJ-025-T04: Validar imágenes disponibles, dimensiones, fallbacks y derechos; datos estructurados sin precios/ofertas inventados.

Validación:

| Test       | Escenario / acción                | Resultado esperado                                                    |
| ---------- | --------------------------------- | --------------------------------------------------------------------- |
| VAL-025-01 | Ficha inexistente y slug antiguo  | 404 o redirección definida, no soft-404 accidental.                   |
| VAL-025-02 | Cambiar imagen en dos releases    | URL cambia o cache revalida; no imagen vieja persistente por un año.  |
| VAL-025-03 | Crawler sobre inventario de rutas | Sin enlaces internos rotos; canonical/sitemap y metadatos coherentes. |

Resultado del objetivo: Publicación indexable, actualizable y sin rutas de demostración engañosas.

Entregables/evidencia de cierre: Reporte de crawl y prueba de actualización de recursos.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-026 — Rendimiento, carga y presupuestos verificables

- Prioridad: P2.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E02, E08, E14.
- Dependencias: OBJ-023, OBJ-025.
- Requisito: Las mejoras de arquitectura se justifican con medidas, no con suposiciones de escala.

Implementación:

- [ ] OBJ-026-T01: Medir HTML, JS, imágenes, carga SSR, consulta, facetas y efectos; separar desarrollo de producción.
- [ ] OBJ-026-T02: Fijar entorno reproducible y presupuesto antes del cierre; conservar baseline y tolerancias.
- [ ] OBJ-026-T03: Probar catálogo actual y fixture ampliado, consultas adversas razonables y concurrencia acordada.
- [ ] OBJ-026-T04: Optimizar transferencias/índices/paginación; no imponer migración servidor o virtualización sin evidencia.

Validación:

| Test       | Escenario / acción                                    | Resultado esperado                                                            |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| VAL-026-01 | Benchmark reproducible frío/caliente y móvil limitado | Resultados registrados y dentro del presupuesto aprobado.                     |
| VAL-026-02 | Carga de lectura en staging aislado                   | Sin crecimiento no acotado de errores/memoria; latencia en objetivo acordado. |
| VAL-026-03 | Repetir tras cambio                                   | Regresión identificable; no comparar entornos distintos.                      |

Resultado del objetivo: Rendimiento aceptado con escenario y límites explícitos.

Entregables/evidencia de cierre: Baseline, presupuesto y reporte de carga; no prueba de carga sobre terceros sin autorización.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F09 — Despliegue, monitorización y recuperación

Responsable propuesto: DevOps + mantenimiento. Dependencias de fase: F01, F08.

Resultado esperado de fase: Promoción trazable, comprobación externa y rollback ensayado.

#### OBJ-027 — Promoción, smoke externo y coherencia del despliegue

- Prioridad: P0.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E02, E11.
- Dependencias: OBJ-003, OBJ-004, OBJ-023, OBJ-024, OBJ-025.
- Requisito: Un build local correcto no demuestra que producción sirva la versión correcta.

Implementación:

- [ ] OBJ-027-T01: Crear candidato de staging y comprobar rutas/identidad fuera del runner.
- [ ] OBJ-027-T02: Promover conforme a política de Vercel verificada.
- [ ] OBJ-027-T03: Ejecutar postdeploy sobre lista de rutas y datos representativos.
- [ ] OBJ-027-T04: Rechazar promoción si cambia SHA, falla salud o aparecen recursos ausentes.

Validación:

| Test       | Escenario / acción                      | Resultado esperado                                                        |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------- |
| VAL-027-01 | Staging con manifiesto correcto         | Artefacto y datos coinciden con checks.                                   |
| VAL-027-02 | Postdeploy de rutas críticas y recursos | Disponibilidad y comportamiento esperados; headers y canonical incluidos. |
| VAL-027-03 | Identidad equivocada simulada           | Promoción bloqueada o rollback automático/controlado.                     |

Resultado del objetivo: Producción sirve la candidata aprobada y no solo la rama más reciente.

Entregables/evidencia de cierre: Registro de promoción y reporte postdeploy.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

#### OBJ-028 — Observabilidad, alertas y rollback ensayado

- Prioridad: P1.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E11.
- Dependencias: OBJ-027.
- Requisito: La estabilidad incluye detectar y recuperar, no solo pasar una ejecución de pruebas.

Implementación:

- [ ] OBJ-028-T01: Correlacionar errores SSR/cliente con release y revisión sin registrar datos sensibles innecesarios.
- [ ] OBJ-028-T02: Configurar sondas, alertas, responsable y procedimiento de incidente.
- [ ] OBJ-028-T03: Conservar fuente de catálogo, originales de imágenes y artefactos; decidir recuperación según almacenamiento real.
- [ ] OBJ-028-T04: Ensayar rollback de aplicación/datos compatibles y verificar caché.

Validación:

| Test       | Escenario / acción               | Resultado esperado                                                    |
| ---------- | -------------------------------- | --------------------------------------------------------------------- |
| VAL-028-01 | Error controlado en staging      | Alerta llega al responsable con release y contexto suficiente.        |
| VAL-028-02 | Simulacro de rollback            | Versión anterior recuperada y smoke correcto dentro del RTO acordado. |
| VAL-028-03 | Recuperación de datos/artefactos | Integridad y URLs comprobadas; limitaciones documentadas.             |

Resultado del objetivo: Incidentes detectables, atribuibles y reversibles con procedimiento probado.

Entregables/evidencia de cierre: Runbook, evidencia de alerta/rollback y política de conservación.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

### F10 — Candidata y autorización de producción

Responsable propuesto: Responsable de producto + QA + DevOps. Dependencias de fase: F09.

Resultado esperado de fase: Expediente de aceptación aprobado y sin bloqueadores abiertos.

#### OBJ-029 — Cerrar candidata con expediente de aceptación

- Prioridad: P0.
- Estado inicial: Pendiente de implementación o cierre.
- Evidencia: E01, E02, E11.
- Dependencias: OBJ-019, OBJ-022, OBJ-026, OBJ-028.
- Requisito: No declarar producción integral sin expediente de evidencia del SHA candidato.

Implementación:

- [ ] OBJ-029-T01: Congelar cambios funcionales y generar informe de criterios de salida.
- [ ] OBJ-029-T02: Revisar defectos pendientes por severidad/ámbito; no ocultarlos como mejoras.
- [ ] OBJ-029-T03: Resolver presupuestos/RTO y decisiones legales/operativas antes de aceptación.
- [ ] OBJ-029-T04: Autorizar release con revisores identificados y ventana de observación acordada.

Validación:

| Test       | Escenario / acción                              | Resultado esperado                                                                 |
| ---------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| VAL-029-01 | Revisión cruzada matriz objetivo-test-evidencia | Toda obligación tiene resultado actual; ninguna pendiente se presenta como pasada. |
| VAL-029-02 | Ensayo completo en candidata limpia             | Gates, deploy, smoke y rollback previstos disponibles.                             |
| VAL-029-03 | Revisión final de excepciones                   | Sin P0/P1 bloqueantes; excepciones menores con fecha y responsable.                |

Resultado del objetivo: Candidata autorizada por evidencia, no por cantidad de código ni número de tests.

Entregables/evidencia de cierre: Expediente de release, decisiones firmadas y registro de observación.

Criterio de cierre: todas las validaciones anteriores ejecutadas sobre el commit candidato, resultado esperado demostrado y revisión registrada. No marcar aceptado por presencia de código.

## 9. Estrategia transversal de pruebas

### 9.1 Capas

1. Unitarias: cálculos, estados desconocidos, predicados, formatos sin efecto en dominio y reglas.
2. Propiedades/invariantes: rangos, orden estable, paginación sin pérdidas, ancestros sin ciclos y preservación de identidad.
3. Contrato: mismo caso en repositorio/DTO/consumidores; TypeScript/SQL donde ambos se soporten.
4. Integración: Postgres real, compilación, aislamiento servidor y dependencias.
5. E2E: artefacto de producción, tres motores, móvil y escritorio, estado persistido/denegado, URLs y navegación.
6. Manual: teclado/lector de pantalla, revisión editorial, legal aplicable y criterios visuales no automatizables.
7. Seguridad: análisis estático, dependencias, secretos sintéticos, cabeceras e inputs autorizados.
8. No funcional: carga, memoria, transferencias, caché y recuperación.

El gate existente de cobertura de líneas del 70% no se interpreta como cobertura de requisitos. Mantenerlo como mínimo heredado y añadir cobertura de ramas/casos críticos según baseline. Todos los VAL críticos deben ejecutarse aunque se supere la cifra global. No establecer porcentajes nuevos como si ya se midieran.

### 9.2 Fixtures mínimos

- Cartucho integrado con malla y cabezal separado con texto legado ambiguo.
- Mismo mod solo y en kits distintos; componentes desconocidos y referencia inválida.
- Encaje físico válido con potencia incompatible; rango parcial y ausente.
- Dos coils de igual ohmiaje con diferentes rangos.
- Líquido con cero y nicotina positiva; desconocido; filtros cruzados en variantes diferentes.
- Concentrado, longfill 10 en 30/120 y conflicto 60 conservado.
- Ratio asimétrico; material vs tecnología y malla múltiple.
- Duplicados, ciclos, referencias de dominio incorrecto, NaN/Infinity y rangos invertidos.
- Storage denegado/corrupto, slug antiguo, límites manipulados y CSP activa.

Los fixtures son sintéticos salvo datos de catálogo identificados. No deben atribuir nuevas especificaciones al fabricante.

### 9.3 Evidencia por ejecución

Registrar: VAL ID, escenario, fixture/revisión, commit, entorno, navegador/Postgres, comando o procedimiento, resultado esperado, resultado observado, estado, hora, enlace o artefacto, incidencia y revisor. Secretos fuera de logs y artefactos. Si se reejecuta, conservar fallos anteriores; no reemplazar evidencia con el último verde.

## 10. Comandos y automatización

Ejecutar desde la raíz de un checkout limpio del repositorio. Estos comandos ya están declarados en la línea base; no se han ejecutado al generar este documento:

```bash
pnpm install --frozen-lockfile
pnpm run check:env
pnpm run format:check
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run test:coverage
pnpm run build
pnpm run smoke
```

Para navegador, reproducir el arranque del servidor y las variables de `.github/workflows/ci.yml`; no ejecutar un smoke contra una URL equivocada ni asumir que `vite dev` equivale al build publicado.

Comandos NUEVOS PROPUESTOS (deben implementarse y documentarse antes de invocarlos como existentes): `validate:catalog`, `test:sql`, `test:contracts`, `test:security`, `test:release`, `test:postdeploy`. Los nombres son contratos de automatización a crear, no herramientas disponibles ya verificadas.

`test:sql` debe usar base desechable y parada ante error; nunca la base de producción. `test:release` agrega validación bloqueante con código de salida no cero al fallar. Postdeploy requiere URL/identidad explícitas. No incorporar tokens a argumentos visibles.

## 11. Seguridad, alcance y políticas operativas

- Advisory de TanStack: comprobar rangos oficiales, lockfile, paquetes transitivos y artefacto; package.json por sí solo no cierra el riesgo. No afirmar explotación sin prueba autorizada.
- CSP: ensayar en staging, observar violaciones, corregir orígenes y aplicar. Elegir nonce/hash compatible con SSR; no resolver con unsafe-inline indiscriminado.
- Endpoints públicos, si existen: validación, límites de consulta y errores; rate limiting solo tras inventario de exposición/riesgo, sin afirmar un ataque no observado.
- SQL distribuido: aclarar que no es runtime actual. RLS/grants y roles deben probarse si se anuncia despliegue público en BD; policies de lectura no sustituyen evaluación del rol real.
- Derechos, privacidad, edad y afirmaciones normativas requieren revisión contextual; el plan no es dictamen jurídico ni sanitario.

## 12. Presupuestos y criterios no funcionales propuestos

Los siguientes son objetivos iniciales de aceptación, NO mediciones actuales. F00/F08 deben fijar entorno y ratificar o sustituirlos mediante ADR antes de la candidata, no después de un fallo para ocultarlo.

| Dimensión              | Objetivo propuesto                                                           | Método y límite                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Exactitud crítica      | 100% de VAL P0/P1 ejecutados y conformes                                     | Matriz de trazabilidad; no equivale a 100% de cobertura de código                   |
| Navegador              | Sin errores inesperados de página/hidratación/red en recorridos críticos     | Chromium, Firefox, WebKit; desktop/móvil definidos                                  |
| Accesibilidad          | Cero incidencias automatizadas graves/críticas y manual crítica sin bloqueos | Herramientas no acreditan conformidad completa por sí solas                         |
| Rendimiento de usuario | LCP ≤2,5 s, CLS ≤0,1 e INP ≤200 ms como objetivo inicial                     | Campo p75 si hay muestra suficiente; laboratorio no se etiqueta INP real            |
| Carga                  | Perfil y latencia p95 acordados antes del ensayo                             | Definir concurrencia y entorno según uso esperado; sin umbral inventado como medido |
| Seguridad              | Ningún alto/crítico aplicable sin tratamiento aprobado                       | Evidencia de aplicabilidad y remediación; no conteo bruto                           |
| Rollback               | RTO propuesto ≤15 min para aplicación                                        | Ensayo real en entorno controlado; revisar alcance datos/caché                      |
| Integridad de release  | SHA/revisión coherentes en artefacto, checks y deploy                        | Manifiesto verificable y smoke postdeploy                                           |
| Observación candidata  | Ventana propuesta de 24–48 h sin incidentes bloqueantes                      | No demuestra disponibilidad histórica ni sustituye carga/E2E                        |

## 13. Secuencia de PR y dependencias

1. PR-A: OBJ-001/002/003/004/005. Baseline, gates y remediación urgente.
2. PR-B: OBJ-006/007/008. Compatibilidad y regresiones críticas.
3. PR-C: OBJ-009/010/011/012. Modelo y migración con adaptadores.
4. PR-D: OBJ-013/014. Validación/evidencia; puede preparar tests en paralelo con PR-C.
5. PR-E: OBJ-015/016/017. Consultas y fronteras.
6. PR-F: OBJ-018/019. Integración SQL y paridad.
7. PR-G: OBJ-020/021/022. Integración UI, accesibilidad y contenido.
8. PR-H: OBJ-023/024/025/026. Verificación transversal y remediaciones.
9. PR-I: OBJ-027/028. Promoción y recuperación.
10. PR-J: OBJ-029. Expediente candidato y autorización.

No fijar plazos antes del diagnóstico inicial. Separar cambios de datos y lógica en commits revisables. Cada PR debe incluir comparación de resultados antes/después, migraciones, compatibilidad y rollback cuando proceda. Las etiquetas de PR propuestas no crean PRs reales.

## 14. Protocolo de migración

1. Snapshot de datos fuente, imágenes y revisiones; hash antes de transformar.
2. Conversión determinista con informe de registros cambiados, conflictos y campos desconocidos.
3. Validación estructural y semántica; no completar por inferencia lo que la fuente no afirma.
4. Adaptadores y aliases para URLs/estado local; pruebas de compatibilidad anterior.
5. Diff editorial por muestras de cada tipo y revisión completa de cambios críticos.
6. Comparación de resultados de reglas; cada cambio requiere causa esperada.
7. Despliegue candidato y mecanismo de recuperación de artefacto/datos/caché.
8. Retirada del legado solo cuando no queden consumidores y regresiones estén cubiertas.

No borrar el modelo anterior antes de poder probar equivalencia donde debe mantenerse y diferencias intencionales donde se corrige un defecto.

## 15. Definición de terminado y autorización

- [ ] Todos los objetivos del alcance están ACEPTADOS con validaciones y evidencia del candidato.
- [ ] Sin P0 ni P1 bloqueantes abiertos; mejoras excluidas tienen ADR y no siguen prometidas públicamente.
- [ ] Tests estructurales, de dominio, contratos, SQL soportado, E2E y seguridad ejecutados.
- [ ] Cambios de datos y resultados de evaluación revisados, sin aumento ficticio de certeza.
- [ ] Versiones transitivas y remediaciones llegan al artefacto y deploy.
- [ ] Manifiesto público identifica SHA y revisiones; postdeploy satisfactorio.
- [ ] Contenido real, fuentes, derechos, correcciones, privacidad y decisiones legales resueltos.
- [ ] SEO, HTTP, imágenes y caché comprobados.
- [ ] Presupuestos no funcionales aprobados y comprobados.
- [ ] Monitorización, responsable de alertas y rollback ensayados.
- [ ] Informe y aprobación por responsables reales; ventana de observación y seguimiento definidos.

## 16. Plantilla de cierre por objetivo

```text
Objetivo:
Commit/PR:
Estado:
Requisito y alcance:
Cambios implementados:
Tests VAL ejecutados:
Resultado esperado:
Resultado observado:
Entorno y revisión de datos:
Artefactos/logs:
Incidencias o limitaciones:
Excepción (si existe): riesgo, mitigación, responsable, vencimiento
Revisor y fecha:
Decisión: ACEPTADO / RECHAZADO / BLOQUEADO
```

## 17. Estado de este entregable

Documento generado y validado estructuralmente: IDs únicos, dependencias existentes y acíclicas, referencias internas resolubles y tests/resultados por objetivo. Esto valida el plan como artefacto, NO el software. No se han creado issues, ramas, commits, PRs o despliegues. La matriz parte con validaciones SIN EJECUTAR. /home/alexendros/Descargas/vapelog-matriz-trazabilidad.csv

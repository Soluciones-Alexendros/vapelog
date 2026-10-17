# Informe baseline F00 — v0.12.0

### Propósito de este documento

- **Objetivos:** Registrar el diagnóstico real sobre el checkout limpio de
  la línea base (OBJ-001), sin corregir el catálogo.
- **Estructura:** Entorno → comandos → inventario → identidad de
  despliegue → huecos NO VERIFICADO.
- **Contenido a integrar según contexto:** Matriz
  [matriz-trazabilidad.csv](./matriz-trazabilidad.csv); plan maestro
  [plan-maestro-cierre-produccion.md](./plan-maestro-cierre-produccion.md).

## Entorno

| Campo                    | Valor                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| Fecha                    | 2026-10-17                                                         |
| SHA                      | `48d5359cba7430667af092d838c1be18c90e7e2a` (tag `v0.12.0`)         |
| Node                     | v26.6.0 (`.nvmrc` pide ≥22)                                        |
| pnpm                     | 11.21.0                                                            |
| `pnpm-lock.yaml` SHA-256 | `b3eb6060cea0bc36134af9e47d6443146ac7ee3c26d8ebf101156bd54f0f524b` |

## Resultados de comandos (checkout limpio)

| Comando                          | Resultado                       |
| -------------------------------- | ------------------------------- |
| `pnpm install --frozen-lockfile` | OK                              |
| `pnpm run check:env`             | OK                              |
| `pnpm run format:check`          | OK                              |
| `pnpm run typecheck`             | OK                              |
| `pnpm run lint`                  | OK                              |
| `pnpm test`                      | OK                              |
| `pnpm run test:coverage`         | OK (líneas ~97 %; umbral ≥70 %) |
| `pnpm run build`                 | OK                              |
| `pnpm run smoke`                 | OK                              |

Log agregado local: `/tmp/vapelog-baseline-report.txt` (sesión de
implementación PR-A). No se modificó el catálogo para «arreglar» fallos:
no hubo fallos que corregir.

## Inventario (resumen)

- Rutas: ver [inventario-capacidades.md](./inventario-capacidades.md).
- Scripts: los de `package.json` (dev, build, test, smoke, a11y, e2e,
  images, etc.).
- Jobs CI (antes de PR-A): `quality`, `test`, `build`, `smoke`,
  `browser`, `fx-e2e`, `smoke-bench` (informativo), `release`.
- Despliegue: cada push a `main` dispara producción en Vercel (documentado
  en `docs/runbooks/deploy.md`).

## Identidad de despliegue y SHA público

| Pregunta                                                                        | Estado                                                                                                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Coincide el SHA servido en producción con `48d5359`?                           | **NO VERIFICADO** — no hay manifiesto público (`/build-manifest.json` → 404) ni cabecera que exponga el commit; no se infiere del copy de la portada. |
| Configuración detallada del proyecto Vercel (vars, dominios custom, protección) | **NO VERIFICADO** — sin acceso API de equipo en esta sesión; solo se confirma HTTP 200 en `https://vapelog-alexendros.vercel.app/`.                   |
| Protección de `main` (antes de PR-A)                                            | Leída vía API: `required_status_checks: null`, sin reviews obligatorias, `enforce_admins: false`.                                                     |

## Contraste GHSA-qx66-fv34-fjm8 (lockfile v0.12.0)

| Paquete                       | Versión resuelta | Rango vulnerable       | Conclusión     |
| ----------------------------- | ---------------- | ---------------------- | -------------- |
| `@tanstack/start-server-core` | 1.169.43         | ≥1.143.12 &lt;1.169.39 | Fuera de rango |
| `@tanstack/react-start`       | 1.169.2          | ≥1.143.12 &lt;1.168.60 | Fuera de rango |

Hallazgo adicional de `pnpm audit --prod` en baseline: `source-map-js`
1.2.1 (alto, GHSA-68fv-2mgg-jv7q). Remediado en PR-A con
`overrides` en `pnpm-workspace.yaml` a ≥1.2.2 (ver ADR-0012).

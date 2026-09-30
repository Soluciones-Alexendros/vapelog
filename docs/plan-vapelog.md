# Plan Vapelog v2.0

### Propósito de este documento

- **Objetivos:** Contrato único de fases F0–F9 (design system, humo, efectos,
  marca, fichas tipo Kimovil, a11y, navegación, SEO, QA). Sustituye a
  `vapelog-plan-maestro.md` / plan neo v3.
- **Estructura:** Resumen → trazabilidad → estado → decisiones → prompt →
  fases F0–F9 → KPIs → pruebas → riesgos → DoD → anexos.
- **Contenido a integrar según contexto:** Casillas marcadas por el ejecutor
  tras cada fase. Detalle de ejecución en la sesión del agente; ADRs en
  `docs/architecture/decisions/`.

|             |                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Versión** | 2.0 — 30-09-2026                                                                                |
| **Sitio**   | `https://vapelog-alexendros.vercel.app` (canónico) · `https://vapelog-beryl.vercel.app` (alias) |
| **Repo**    | `github.com/Soluciones-Alexendros/vapelog`                                                      |
| **Stack**   | TanStack Start · React 19 · TypeScript · Tailwind v4 · OKLCH · Nitro · pnpm · Node 22           |

## 1. Resumen ejecutivo

**Objetivo.** Design system neo-brutalista dual coherente, fondo de humo
visible y estable, efectos con fallo visible, marca vectorial, fichas tipo
Kimovil, WCAG 2.2 AA y navegación fluida.

**Diagnóstico.** El humo, `KindCard`, tipografía cinética y transiciones ya
existen; falla la **ejecución en runtime** (apilado opaco, preferencia
binaria, reduced-motion que ocultaba el canvas). F0 repara y blinda con
tests antes de construir.

**Estrategia.** Reparar antes de construir → fallo visible → tokens primero →
contenido antes que decoración → todo verificable.

## 2. Trazabilidad

| Petición                        | Fase(s)  |
| ------------------------------- | -------- |
| Design system                   | F1       |
| Logo/favicon                    | F4       |
| Animaciones y efectos           | F3 (+F0) |
| Formato Kimovil                 | F5       |
| Frontend y a11y                 | F6 (+F0) |
| UX navegación                   | F7       |
| Fondo de humo                   | F2 (+F0) |
| Interactividad / humo invisible | **F0**   |

## 3. Decisiones cerradas

- Identidad dual claro brutalista / oscuro neón; color por tipo `--kind-*`.
- Efectos: vapor, cinética ASCII, terminal, KindCard LED/tilt.
- Logo: V con voluta + wordmark.
- Humo sutil detrás del contenido.
- Sin precios ni puntuaciones; «Sin dato publicado» si falta el dato.
- Dominio canónico `vapelog-alexendros.vercel.app`.
- **ADR-0009** enmienda ADR-0007: reduced → static; Q0 solo Save-Data;
  gobernador con recuperación; clave `vapelog-fx:v2`.

## 4. Prompt maestro

Ver sección 6 del plan de producto original. Reglas duras: F0 primero; no
inventar datos; un commit por fase; fallback + reduced + reason; no cambiar
rutas ni modelo de datos.

## 5. Fases

### F0 — Diagnóstico y reparación (bloqueante)

- [x] **F0-01** Snippet de diagnóstico documentado (`docs/guides/fx-diagnostico.md`)
- [x] **F0-02** Comparar dominios / commit (anotado en diagnóstico; 308 en F8)
- [x] **F0-03** Reproducir con build + preview
- [x] **F0-04** Causas: stacking body opaco, reduced→static, Q0, gobernador, catch mudos
- [x] **F0-05** Overlay `?fx=debug`
- [x] **F0-06** `window.__vapelogFx`
- [x] **F0-07** Conmutador Auto · Activados · Desactivados
- [x] **F0-08** Sin catch mudos en humo/FX
- [x] **F0-09** Capas decorativas `pointer-events:none`
- [x] **F0-10** Hidratación / dataset fx en `<html>`
- [ ] **F0-11** Unificar despliegue de dominios (F8 / release)
- [x] **F0-12** Tests e2e + script `test:e2e`
- [x] **F0-13** Causa raíz en `fx-diagnostico.md`
- [ ] **F0-14** Verificar producción tras deploy

**Aceptación F0**

- [x] Auto sin reduce: humo visible y en movimiento (e2e)
- [x] Reduced: fotograma estático, `reason: reduced-motion`
- [x] Desactivados: L0, `reason: user-off`
- [x] Suite `pnpm run test:e2e`

### F1 — Design system

- [x] Tokens movimiento (`--ease-vapor`) y capas z-index
- [x] `docs/design-system.md`
- [x] Contraste con grids alineados a tiers F2
- [ ] Auditoría exhaustiva de colores mágicos en CI (follow-up)

### F2 — Humo

- [x] Tiers 87/54/32 (máximo bajo contrato de contraste; plan 120/70/36 no cabe)
- [x] Carga diferida post-paint / idle
- [x] Pausa blur 5 s + `document.hidden`
- [ ] Cursor puff fino (omitido: margen de contraste)
- [x] Nota en `humo-resultados.md`

### F3 — Efectos

- [x] Conmutador Auto/On/Off aplica a todos los efectos (`mode === animated`)
- [x] Vapor usa `--ease-vapor`
- [ ] IntersectionObserver compartido formal (follow-up)

### F4 — Logo y favicon

- [x] Entregables ya en `public/` (mark, mono, favicons, og)
- [ ] Wordmark con voluta tipográfica adicional (pulido follow-up)

### F5 — Contenido tipo Kimovil

- [x] Líquidos por resistencia: tabs, 12 + Ver N, filtro, DOM ≤ 60
- [x] SpecTable oculta «Sin dato publicado» con revelado
- [x] Home/listados/ficha base ya existían
- [ ] Layout 2 columnas desktop formal (follow-up)

### F6 — Frontend y a11y

- [x] Nombres de enlace sin fitLabel duplicado
- [x] Label del selector Resistencia
- [x] Contadores separados en headings
- [ ] Matriz axe 8×2×2 completa (follow-up; a11y-pass en CI)

### F7 — Navegación

- [x] Ctrl/Cmd+K además de `/`
- [x] Comparador persistente y paleta ya existían
- [ ] Barra móvil dedicada (follow-up)

### F8 — SEO e infra

- [x] `vercel.json` 308 beryl → alexendros
- [x] Cache immutable `/catalog/*` y `/assets/*`
- [x] ADR-0010
- [x] Titles `— Vapelog` en rutas de contenido

### F9 — QA y cierre

- [x] typecheck / lint / test / e2e locales
- [x] CHANGELOG Unreleased
- [ ] Release etiquetada (requiere confirmación humana)
- [ ] Verificación snippet en producción tras merge

## 6. KPIs y pruebas

Ver plan de producto §8–§9. Scripts: `pnpm run test:e2e`, `smoke-bench`,
`smoke-verify`, `a11y`, `contrast.test.ts`.

## 7. Anexos

- Capas CSS: `src/styles.css` (`--z-smoke`, html background).
- Controlador: `src/lib/fx/controller.ts`.
- Tests e2e: `e2e/fx-smoke.spec.ts`.
- ADR-0009: fallo visible.

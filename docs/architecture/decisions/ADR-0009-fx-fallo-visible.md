# ADR-0009 — Fallo visible de efectos (conmutador, reason, fallback estático)

### Propósito de este documento

- **Objetivos:** Registrar el contrato de fallo visible de efectos (F0 del plan
  `docs/plan-vapelog.md`): preferencia Auto/On/Off, `reason` consultable,
  fotograma estático con reduced-motion y gobernador con recuperación.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Código en `src/lib/fx/controller.ts`,
  `src/lib/fx.ts`, `src/components/smoke-canvas.tsx` y overlay
  `src/components/fx-debug.tsx`. Enmienda política de
  [ADR-0007](./ADR-0007-humo-v2.md) en reduced-motion, Q0 y degradación.

## Estado

Aceptado (2026-09-30)

## Contexto

ADR-0007 dejó un humo v2 con modelo puro y tiers, pero el runtime podía
apagarse en silencio: canvas detrás de un `body` opaco, `prefers-reduced-motion`
ocultaba el layer con `display:none`, la preferencia era binaria `on`/`off` sin
`auto`, y la degradación de tier era irreversible en la sesión. El plan v2.0
exige que un efecto que «no carga» deje un motivo consultable y un fallback
estático no vacío.

## Decisión

- **Preferencia** `auto | on | off` en `localStorage` clave `vapelog-fx:v2`
  (legacy `vapelog-fx` se interpreta como on/off o cae a `auto`).
- **`decide(pref, env)`** produce `mode` (`animated` | `static` | `off`) y
  `reason` (`ok` | `reduced-motion` | `user-off` | `save-data` | …).
  `on` es acción explícita y puede anular reduced-motion del SO.
- **Q0 (sin canvas)** solo con Save-Data real o preferencia `off`. Pocos
  núcleos (`≤ 4`) limitan a Q1, nunca a Q0.
- **Reduced-motion** → modo `static`: un fotograma precalentado, sin rAF.
- **Gobernador** con histéresis: baja tras >24 ms durante 2 s; recupera tras
  10 s estables (<18 ms).
- **Apilado:** fondo en `html`, `body` transparente, `--z-smoke` / `--z-content`
  (Anexo A del plan).
- **API de diagnóstico:** `window.__vapelogFx` (solo lectura) y overlay
  `?fx=debug`.
- **Conmutador** accesible Auto · Activados · Desactivados en cabecera.
- Los números de partículas/alfa de ADR-0007 se conservan en F0; el retuning
  de densidad queda para F2.

## Consecuencias

- Hay que actualizar benches (`smoke-bench`, `smoke-verify`, `visual-smoke`) a
  la clave `vapelog-fx:v2`.
- Los consumidores de efectos comprueban `mode === "animated"` (no `pref ===
"on"`).
- Tests: `src/data/fx-controller.test.ts` y `e2e/fx-smoke.spec.ts`
  (`pnpm run test:e2e`).
- ADR-0007 sigue vigente para el modelo puro y las capas L0–L4; este ADR
  sustituye su política de apagado silencioso y degradación irreversible.

# Guía — Diagnóstico de efectos (F0)

### Propósito de este documento

- **Objetivos:** Registrar la salida del snippet de diagnóstico, la causa raíz
  del humo invisible y la corrección aplicada en F0.
- **Estructura:** Entorno → snippet → hallazgos → causa raíz → corrección →
  verificación.
- **Contenido a integrar según contexto:** Código en `src/styles.css`,
  `src/lib/fx/controller.ts`, `src/components/smoke-canvas.tsx`. ADR asociado:
  [ADR-0009](../architecture/decisions/ADR-0009-fx-fallo-visible.md).

## Entorno

- Fecha: 2026-09-30
- Build local de producción (`pnpm run build` + Nitro `.output/server`)
- Dominio canónico en código: `https://vapelog-alexendros.vercel.app`
  (`src/lib/site.ts`). Alias `beryl`: divergencia SEO anotada (E1); 308 en F8.

## Snippet

```js
({
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  fx: localStorage.getItem("vapelog-fx:v2") ?? localStorage.getItem("vapelog-fx"),
  saveData: navigator.connection?.saveData,
  cores: navigator.hardwareConcurrency,
  vt: "startViewTransition" in document,
  canvas: [...document.querySelectorAll("canvas")].map((c) => {
    const s = getComputedStyle(c);
    return {
      w: c.width,
      h: c.height,
      z: s.zIndex,
      pos: s.position,
      op: s.opacity,
      vis: s.visibility,
      display: s.display,
    };
  }),
  htmlBg: getComputedStyle(document.documentElement).backgroundColor,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  vapelogFx: window.__vapelogFx,
});
```

## Hallazgos (antes de F0)

| Campo     | Valor típico (preview)         | Lectura                            |
| --------- | ------------------------------ | ---------------------------------- |
| `bodyBg`  | opaco (`oklch` / rgb del tema) | Tapa el canvas con `z-index: -10`  |
| `htmlBg`  | default / transparente         | El color no vivía en `html`        |
| canvas    | presente, w/h > 0, rAF activo  | El modelo corría; no se veía       |
| `reduced` | según SO                       | CSS hacía `display:none` del layer |
| `fx`      | `on`/`off` o null              | Sin valor `auto` ni reason         |

## Causa raíz

**Apilado:** `body { background: var(--background) }` + `.smoke-layer { z-index: -10 }`
deja el canvas detrás del fondo opaco del `body`. El humo se calculaba y
`window.__vapelogSmoke` existía, pero la pintura quedaba invisible.

Contribuyentes: reduced-motion ocultaba el layer; preferencia binaria sin
`auto`; degradación de tier irreversible (ADR-0007).

## Corrección (F0)

1. Fondo en `html`; `body` transparente; `--z-smoke` / `--z-content`.
2. Controlador `auto|on|off` + `decide` + `TierGovernor` con recuperación.
3. Modo `static` (fotograma precalentado) con reduced-motion.
4. `window.__vapelogFx` + overlay `?fx=debug`.
5. Conmutador Auto · Activados · Desactivados.
6. Suite `pnpm run test:e2e` (`e2e/fx-smoke.spec.ts`).

## Verificación esperada (tras F0)

```json
{
  "bodyBg": "rgba(0, 0, 0, 0)",
  "vapelogFx": { "reason": "ok", "running": true, "mode": "animated" }
}
```

Con `prefers-reduced-motion: reduce` y preferencia `auto`:
`reason: "reduced-motion"`, `running: false`, cobertura de canvas > 0.

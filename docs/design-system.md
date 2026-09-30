# Design system — Vapelog

### Propósito de este documento

- **Objetivos:** Inventario conciso de tokens, tipografía, capas z-index,
  conmutador FX y tarjetas por tipo para agentes y mantenedores.
- **Estructura:** Temas → color por tipo → tipografía → brutalismo →
  movimiento → capas → FX → KindCard → fuentes.
- **Contenido a integrar según contexto:** Valores vivos en
  [`src/styles.css`](../src/styles.css). Decisiones en
  [ADR-0008](architecture/decisions/ADR-0008.md) (neo-brutalista dual) y
  [ADR-0009](architecture/decisions/ADR-0009-fx-fallo-visible.md) (fallo
  visible de efectos). No inventar tokens ausentes del CSS.

## Temas duales

- Claro (default): fondo hueso, borde tinta, sombra dura desplazada.
- Oscuro: clase `.dark` en `html`, neón/halo por tipo, radio `0.25rem`.
- Persistencia de tema: `vapelog-theme`. Tokens semánticos shadcn:
  `bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.

## Color por tipo (`--kind-*`)

| Tipo        | Token                | Uso     |
| ----------- | -------------------- | ------- |
| Dispositivo | `--kind-dispositivo` | ámbar   |
| Resistencia | `--kind-resistencia` | cian    |
| Líquido     | `--kind-liquido`     | magenta |
| Componente  | `--kind-componente`  | violeta |

`[data-kind="…"]` fija `--kind-color`. El tipo se lee siempre por color +
icono + etiqueta (WCAG 1.4.1).

## Tipografía

| Rol               | Familia              | Token / clase                    |
| ----------------- | -------------------- | -------------------------------- |
| Titulares `h1–h3` | Archivo Black        | `--font-display`, `font-display` |
| Datos / ASCII     | Space Mono           | `--font-mono`, `font-mono`       |
| Cuerpo            | Public Sans Variable | `--font-sans`                    |

Autoalojadas vía `@fontsource` / `@fontsource-variable` (OFL).

## Tokens brutalistas

- `--ink` — tinta de borde en claro.
- `--brut-border: 3px` — grosor de borde claro.
- `--brut-offset: 6px` — desplazamiento de la sombra dura (`.kind-card::before`).
- Clases: `.kind-card`, `.brut-border` (si aplica en utilidades).

## Movimiento

| Token                 | Valor típico                     | Uso                    |
| --------------------- | -------------------------------- | ---------------------- |
| `--dur-1` … `--dur-4` | 120 / 200 / 400 / 700 ms         | micro → vapor/cinética |
| `--ease-out`          | `cubic-bezier(0.22, 1, 0.36, 1)` | entradas               |
| `--ease-in-out`       | `cubic-bezier(0.65, 0, 0.35, 1)` | ida y vuelta           |
| `--ease-vapor`        | `cubic-bezier(0.3, 0, 0.2, 1)`   | `vapor-out`            |

Con `prefers-reduced-motion: reduce`, las duraciones caen a ~0 y los ease a
`linear`. Utilidades: `duration-1` … `duration-4`.

## Capas z-index

| Token         | Valor | Capa                         |
| ------------- | ----- | ---------------------------- |
| `--z-smoke`   | 0     | canvas / fallback de humo    |
| `--z-content` | 1     | `header` / `main` / `footer` |
| `--z-sticky`  | 20    | sticky                       |
| `--z-overlay` | 40    | diálogos                     |
| `--z-toast`   | 60    | toasts                       |

Fondo en `html`; `body` transparente para no tapar el humo (ADR-0009).

## Conmutador FX (Auto / On / Off)

- Preferencia `auto | on | off` en `localStorage` (`vapelog-fx:v2`).
- UI en cabecera (tema + FX). Modos runtime: `animated` | `static` | `off`
  con `reason` consultable (`window.__vapelogFx`, `?fx=debug`).
- Contrato completo: ADR-0009. No editar `smoke-canvas` / `lib/fx/**` desde
  este documento.

## KindCard y LED

- Componente: `src/components/ui/kind-card.tsx` → clase `.kind-card` +
  `data-kind`.
- LED: `.kind-led` tenue en reposo; `led-breathe` (solo opacity) en
  hover/foco; como máximo una tarjeta animada a la vez.
- Claro: borde `--brut-border` + sombra dura en `--kind-color`.
- Oscuro: borde fino + glow; sin sombra dura (`::before` oculto).

## Fuentes de verdad

1. [`src/styles.css`](../src/styles.css)
2. [ADR-0008](architecture/decisions/ADR-0008.md)
3. [ADR-0009](architecture/decisions/ADR-0009-fx-fallo-visible.md)
4. Este archivo (inventario; no sustituye a los ADR)

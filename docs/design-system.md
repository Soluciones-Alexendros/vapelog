# Design system — Vapelog

### Propósito de este documento

- **Objetivos:** Inventario conciso de tokens, tipografía, capas z-index y
  tarjetas por tipo para agentes y mantenedores.
- **Estructura:** Temas → color por tipo → tipografía → movimiento → capas →
  KindCard → fuentes.
- **Contenido a integrar según contexto:** Valores vivos en
  [`src/styles.css`](../src/styles.css). Decisión vigente:
  [ADR-0016](architecture/decisions/ADR-0016-direccion-visual-sobria.md)
  (dirección sobria). ADR-0008 / ADR-0007 / ADR-0009 quedan sustituidos en
  estilo y humo. No inventar tokens ausentes del CSS.

## Temas

- Claro y oscuro: clase `.dark` en `html`, persistencia `vapelog-theme` ∈
  `light | dark | system`, script anti-FOUC.
- Superficies neutras y opacas. Radio único `0.375rem` en ambos temas.
- Tokens semánticos shadcn: `bg-background`, `text-foreground`, `bg-card`,
  `border-border`, `ring`, `destructive`, `success`, `warning`, `info`, etc.
- Sin neón, glow, sombra dura brutalista, LED, partículas ni conmutador de
  efectos.

## Color por tipo (`--kind-*`)

| Tipo        | Token                | Uso     |
| ----------- | -------------------- | ------- |
| Dispositivo | `--kind-dispositivo` | ámbar   |
| Resistencia | `--kind-resistencia` | cian    |
| Líquido     | `--kind-liquido`     | magenta |
| Componente  | `--kind-componente`  | violeta |

`[data-kind="…"]` fija `--kind-color`. El tipo se lee siempre por color +
icono + etiqueta (WCAG 1.4.1). Los matices son señal atenuada (marcador),
no halo.

## Tipografía

| Rol               | Familia              | Token / clase                 |
| ----------------- | -------------------- | ----------------------------- |
| Titulares `h1–h3` | Public Sans Variable | `--font-sans`, peso semibold+ |
| Datos / cifras    | Space Mono           | `--font-mono`, `tabular-nums` |
| Cuerpo            | Public Sans Variable | `--font-sans`                 |

Autoalojadas vía `@fontsource` / `@fontsource-variable` (OFL). Archivo Black
queda fuera del contrato (ADR-0016).

## Movimiento

| Token                 | Valor típico                     | Uso                |
| --------------------- | -------------------------------- | ------------------ |
| `--dur-1` … `--dur-2` | 120 / 200 ms                     | microinteracciones |
| `--ease-out`          | `cubic-bezier(0.22, 1, 0.36, 1)` | entradas           |
| `--ease-in-out`       | `cubic-bezier(0.65, 0, 0.35, 1)` | ida y vuelta       |

Solo `transform` / `opacity`. Con `prefers-reduced-motion: reduce`, las
duraciones caen a ~0. Sin scramble, vapor con blur, glitch ni tilt.

## Capas z-index

| Token         | Valor | Capa                         |
| ------------- | ----- | ---------------------------- |
| `--z-content` | 1     | `header` / `main` / `footer` |
| `--z-sticky`  | 20    | sticky                       |
| `--z-overlay` | 40    | diálogos                     |
| `--z-toast`   | 60    | toasts                       |

Fondo opaco en `html` y `body`.

## Preferencia FX (legado)

- Claves `vapelog-fx` / `vapelog-fx:v2` se leen una vez al arrancar, se
  borran y no se reescriben (ADR-0017 / U5). No hay radiogrupo ni canvas.

## KindCard

- Componente: `src/components/ui/kind-card.tsx` → clase `.kind-card` +
  `data-kind`.
- Borde sutil + marcador de color del tipo. Sin LED, sin glow, sin sombra
  dura desplazada, sin spotlight ni tilt.

## Fuentes de verdad

1. [`src/styles.css`](../src/styles.css)
2. [ADR-0016](architecture/decisions/ADR-0016-direccion-visual-sobria.md)
3. Este archivo (inventario; no sustituye al ADR)

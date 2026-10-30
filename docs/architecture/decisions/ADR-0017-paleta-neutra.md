# ADR-0017 — Paleta neutra, tipografía mono y cierre de legado

### Propósito de este documento

- **Objetivos:** Registrar las decisiones D1–D5 del cierre de la migración
  visual: paleta neutra tono 260, kinds pastel-gris, estado de `/comparar` en
  la URL, JetBrains Mono y retirada del blog de ejemplo.
- **Estructura:** Estado → contexto → decisión → tokens → reglas de acento →
  consecuencias.
- **Contenido a integrar según contexto:** Valores vivos en `src/styles.css`
  tras la unidad U2. Extiende
  [ADR-0016](./ADR-0016-direccion-visual-sobria.md) (dirección sobria) y
  actualiza los valores de [ADR-0002](./ADR-0002-tokens.md). No reinstaura
  humo, neón ni afiliación con xAI ([ADR-0003](./ADR-0003-retirada-grok.md)).

## Estado

Aceptado (2026-10-30)

## Contexto

ADR-0016 retiró la ornamentación y el humo de la UI, pero dejó en el árbol
código muerto, una paleta con tono cálido (75–90) y acento ámbar, Space Mono
en cifras, artículos de ejemplo en `/blog` y la selección del comparador solo
en `localStorage`. El plan v2 cierra ese resto en unidades independientes.
Los valores de abajo son **propuesta de Vapelog**. No hay URL de referencia
Grok/xAI archivada en el repositorio: no se inventa una y no se afirma
«diseño canónico de xAI».

## Decisión

1. **D1 — Acento neutro-frío.** Neutros con tono ≈ 260. Primario azul-grisáceo
   (`oklch` L/C/H de la tabla). Se elimina el ámbar de `--primary`.
2. **D2 — Color por categoría.** `--kind-*` con croma 0,045. Nunca como único
   portador: los puntos `kind-mark` van siempre con texto (DISP / RES / LÍQ /
   COMP o el nombre completo).
3. **D3 — Estado en la URL.** Además del `theme-color` sincronizado con
   `--background`, `/comparar` publica `dominio` y `fichas` en la query. Una
   selección válida en la URL manda sobre `localStorage` al entrar en esa
   ruta.
4. **D4 — Fuente mono.** JetBrains Mono (SIL OFL 1.1) sustituye a Space Mono
   en cifras y unidades (`tabular-nums`). Public Sans se mantiene en interfaz.
5. **D5 — Blog.** Se retiran los artículos de ejemplo. `/blog` y `/blog/$slug`
   redirigen a `/archivo`. Sin texto editorial inventado.
6. **Preferencia FX (enmienda a ADR-0016 §5).** Las claves `vapelog-fx` y
   `vapelog-fx:v2` se leen una vez al arrancar, se borran y no se reescriben.
   El código muerto de efectos se elimina en la unidad U5.
7. **Tipografía mono (enmienda a ADR-0016 §7).** Space Mono queda sustituido
   por JetBrains Mono Variable (unidad U3), tras retirar el atlas del canvas.

`--destructive`, `--success`, `--warning` e `--info` conservan su tono. Solo
se ajustan si el test de contraste falla con los fondos nuevos.

## Tokens propuestos

Valores de propuesta. El test `src/data/contrast.test.ts` prevalece sobre
esta tabla. Las equivalencias hex de `THEME_COLOR_LIGHT` y `THEME_COLOR_DARK`
se derivan del mismo paso OKLCH→sRGB que usa ese test.

### Claro (`:root`)

| Token                         | Valor                                  | Contraste vs fondo  |
| ----------------------------- | -------------------------------------- | ------------------- |
| `--background`                | `oklch(0.985 0.003 260)` (≈ `#F9FAFC`) | —                   |
| `--card` / `--popover`        | `oklch(1 0 260)`                       | —                   |
| `--foreground`                | `oklch(0.18 0.01 260)`                 | 18,0:1              |
| `--muted-foreground`          | `oklch(0.45 0.012 260)`                | 7,1:1               |
| `--border`                    | `oklch(0.90 0.005 260)`                | decorativo          |
| `--input` / `--border-strong` | `oklch(0.60 0.012 260)`                | 3,8:1               |
| `--primary`                   | `oklch(0.42 0.10 255)`                 | 8,1:1               |
| `--primary-foreground`        | `oklch(0.99 0.003 260)`                | 8,3:1 sobre primary |
| `--ring`                      | `oklch(0.50 0.13 255)`                 | 5,8:1               |
| `--kind-dispositivo`          | `oklch(0.50 0.045 85)`                 | 5,8:1               |
| `--kind-resistencia`          | `oklch(0.50 0.045 200)`                | 5,6:1               |
| `--kind-liquido`              | `oklch(0.50 0.045 330)`                | 5,9:1               |
| `--kind-componente`           | `oklch(0.50 0.045 270)`                | 5,8:1               |

### Oscuro (`.dark`)

| Token                         | Valor                                         | Contraste vs fondo  |
| ----------------------------- | --------------------------------------------- | ------------------- |
| `--background`                | `oklch(0.145 0.004 260)` (≈ `#090A0C`)        | —                   |
| `--card` / `--popover`        | `oklch(0.19 0.005 260)`                       | —                   |
| `--foreground`                | `oklch(0.97 0.004 260)`                       | 18,2:1              |
| `--muted-foreground`          | `oklch(0.76 0.01 260)`                        | 9,2:1               |
| `--border`                    | `oklch(0.28 0.006 260)`                       | decorativo          |
| `--input` / `--border-strong` | `oklch(0.58 0.012 260)`                       | 4,6:1               |
| `--primary`                   | `oklch(0.78 0.09 250)`                        | 9,9:1               |
| `--primary-foreground`        | `oklch(0.15 0.01 260)`                        | 9,9:1 sobre primary |
| `--ring`                      | `oklch(0.78 0.10 250)`                        | 9,9:1               |
| `--kind-*`                    | L 0,80 · C 0,045 · tonos 85 / 200 / 330 / 270 | ≥ 10:1              |

`--surface-1/2/3` y los bloques `@media (prefers-contrast: more)` y
`forced-colors` se rehacen con tono 260 y croma ≤ 0,01.

## Reglas de uso del acento

El acento (`--primary` / `--ring`) se usa para: enlace activo, foco,
selección, botón primario y contador del comparador. No para decoración,
etiquetas ni bordes de tarjeta.

Tema: clase `.dark`, clave `vapelog-theme` ∈ `light | dark | system`, valor
por defecto `system`. No se impone oscuro.

## Consecuencias

- Los valores concretos se aplican en la unidad U2. La tipografía mono en U3.
- La limpieza de efectos (U5), el blog (U6), la cabecera (U4), la URL de
  `/comparar` (U7) y las calculadoras (U8) siguen este contrato.
- ADR-0016 §5 y §7 quedan enmendados por los puntos 6 y 7 de este ADR; el
  resto de ADR-0016 permanece.
- No se inventan datos técnicos de fichas ni se rebajan gates de cobertura,
  smoke, a11y, secretos, SCA o SQL.

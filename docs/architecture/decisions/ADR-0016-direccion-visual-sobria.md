# ADR-0016 — Dirección visual sobria

### Propósito de este documento

- **Objetivos:** Sustituir la identidad ornamental neo-brutalista/neón y el
  humo ambiental por una dirección visual sobria de Vapelog, y dejar escrito
  qué contratos de tema, accesibilidad y CI se conservan.
- **Estructura:** Estado → contexto → decisión → inventario retirado →
  tipografía → consecuencias.
- **Contenido a integrar según contexto:** Valores vivos en
  `src/styles.css`. Este ADR sustituye el estilo de
  [ADR-0008](./ADR-0008.md) y la obligación de mostrar humo de
  [ADR-0007](./ADR-0007-humo-v2.md) y [ADR-0009](./ADR-0009-fx-fallo-visible.md).
  No toca [ADR-0003](./ADR-0003-retirada-grok.md),
  [ADR-0004](./ADR-0004-puerta-de-edad-y-ssr.md),
  [ADR-0011](./ADR-0011-normalizacion-dominio.md) ni el grafo de
  [ADR-0012](./ADR-0012-alcance-cierre-y-gates.md).

## Estado

Aceptado (2026-10-30)

## Contexto

ADR-0008 fijó claro brutalista (borde tinta 3 px, sombra dura) y oscuro neón
(halo, LED, tilt, scramble, vapor). ADR-0007 y ADR-0009 fijaron el canvas de
humo y el conmutador `vapelog-fx:v2`. La prioridad de producto pide superficies
opacas, jerarquía por espacio y tipografía, color solo con significado, y
retirar neón, glow, partículas y controles de efecto sin función. El operador
autorizó cambiar esa decisión. La identidad visible sigue siendo **Vapelog**,
sin simular afiliación con xAI ni copiar marcas o tipografías propietarias.

## Decisión

1. **Superficies.** Fondos y tarjetas neutros, croma bajo, opacos. Un radio
   pequeño único en ambos temas (`0.375rem`). Elevación como mucho
   `--shadow-1` neutra. Sin `--brut-border`, `--brut-offset` ni sombra en el
   color del tipo.
2. **Color.** Se conservan los nombres semánticos shadcn (`background`,
   `foreground`, `card`, `primary`, `muted`, `destructive`, `border`, `ring`,
   `chart-*`, estados `success` / `warning` / `info`). El color de tipo
   (`--kind-*`) sigue siendo señal con icono y etiqueta; deja de usarse como
   halo o LED. Contraste de texto ≥ 4,5:1; borde de control y anillo de foco
   ≥ 3:1; ΔE OKLab entre kinds ≥ 15.
3. **Tema.** Claro y oscuro con clase `.dark`, `vapelog-theme` ∈
   `light | dark | system`, script anti-FOUC. No se impone oscuro por
   defecto. Los valores de `theme-color` se sincronizan tras hidratar.
4. **Retirada ornamental.** Se retiran neón y resplandores, sombra dura
   desplazada, LED, spotlight, tilt, tipografía cinética (scramble), vapor
   con blur en view transitions, glitch de botones, caret de terminal,
   partículas de humo, capas L0 decorativas y el radiogrupo de efectos.
5. **Preferencia FX.** Las claves `vapelog-fx` y `vapelog-fx:v2` se leen de
   forma compatible y no relanzan efectos. La UI del conmutador desaparece.
6. **Movimiento restante.** Solo transiciones breves de `transform` /
   `opacity` (acordeón, diálogo, focus), con `prefers-reduced-motion` a ~0.
7. **Tipografía.** Public Sans en interfaz y titulares. Space Mono solo en
   cifras y unidades (`tabular-nums`). Archivo Black se retira con el
   brutalismo.
8. **Marca.** Se conservan la voluta y los SVG exigidos por
   `scripts/brand-check.mjs`. Foco visible, validación, progreso, fotos y
   «Sin dato publicado» se mantienen.
9. **CI.** El job `fx-e2e` sigue en `release-ready` (ADR-0012). Cambia el
   contrato de la prueba: ausencia de canvas de humo y de conmutador FX, no
   la presencia del efecto.

### Inventario de efectos retirados

| Efecto                 | Definición / consumidor            |
| ---------------------- | ---------------------------------- |
| Halo neón de tarjeta   | `.dark .kind-card` `box-shadow`    |
| LED / `led-breathe`    | `.kind-led`                        |
| Spotlight radial       | `.kind-card::after`, `use-card-fx` |
| Tilt ≤ 4°              | `src/lib/fx/tilt.ts`               |
| Sombra dura brutalista | `.kind-card::before`, `--brut-*`   |
| Vapor view-transition  | `vapor-out` / `vapor-in`           |
| Scramble cinético      | `kinetic-heading.tsx`              |
| Count-up               | `count-up.tsx`                     |
| Glitch `:active`       | botones                            |
| Caret de terminal      | `.term-caret`                      |
| Humo canvas + L0 CSS   | `smoke-canvas.tsx`, `body::before` |
| Conmutador FX          | radiogrupo en `theme-toggle.tsx`   |
| Overlay `?fx=debug`    | `fx-debug.tsx`                     |

### Wireframes (ASCII)

```
Shell
┌──────────────────────────────────────────┐
│ Logo  Catálogo…  Buscar  Comparar  Herr. │
│                              Tema Cl/Os  │
├──────────────────────────────────────────┤
│ main                                     │
├──────────────────────────────────────────┤
│ pie: dominios · archivo · modelo         │
└──────────────────────────────────────────┘

Catálogo
┌──────────┬───────────────────────────────┐
│ Filtros  │ Búsqueda · orden · N resultados│
│ agrupados│ [tarjeta] [tarjeta] …         │
│ Activos  │ Abrir ficha | Comparar        │
│ Limpiar  │ vacío → limpiar filtros       │
└──────────┴───────────────────────────────┘

Ficha / Comparador / Formulario
Resumen → specs por finalidad → fuentes
Tabla alineada · Solo diferencias · Sin dato
Etiqueta · ayuda · unidad · error · reinicio
```

## Consecuencias

- ADR-0008 queda sustituido en estilo (identidad dual, LED, cinética, vapor,
  glitch, brutalismo). La estrategia `.dark` y los nombres shadcn siguen.
- ADR-0007 y ADR-0009 quedan sustituidos en la obligación de renderizar humo
  y el conmutador visible. El modelo puro de humo puede permanecer en el
  árbol como código muerto hasta la limpieza de la oleada de retirada; no se
  monta en la UI.
- `docs/design-system.md` describe la dirección sobria.
- `contrast.test.ts` deja de exigir `--brut-border` / `--brut-offset` y el
  contrato nombrado «neón»; mantiene contraste de kinds y ΔE.
- `e2e/fx-smoke.spec.ts` se reescribe al contrato de ausencia.
- No se inventan datos técnicos ni se rebajan gates de cobertura, smoke,
  a11y, secretos, SCA o SQL.

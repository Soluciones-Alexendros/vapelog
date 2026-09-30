# Arquitectura — Vapelog

### Propósito de este documento

- **Objetivos:** Describir la forma del sistema a alto nivel y apuntar a
  overview y ADRs.
- **Estructura:** Resumen → mapa → enlaces.
- **Contenido a integrar según contexto:** No dupliques runbooks ni el
  detalle de tokens; enlázalos.

## Resumen

Vapelog es una aplicación SSR con **TanStack Start** (Vite + React Router)
que sirve un catálogo tipado en TypeScript (`src/data/`). Las fichas se
renderizan en el cliente/SSR desde datos en memoria; las imágenes fuente viven
en `assets/catalog/` (tracked, no se sirven) y sus variantes webp/avif generadas
en `public/catalog/` (regenerar con `pnpm run images`). No hay base de datos en
runtime ni autenticación.

## Mapa

| Área          | Ubicación                          |
| ------------- | ---------------------------------- |
| Rutas         | `src/routes/`                      |
| Fichas / UI   | `src/components/`                  |
| Catálogo      | `src/data/catalog.ts` + specs      |
| Humo          | `src/lib/smoke/`                   |
| Cinética / FX | `src/lib/kinetic/` + `src/lib/fx/` |
| Tokens / tema | `src/styles.css`                   |
| Smoke / env   | `scripts/`                         |

## Detalle

- Overview: [docs/architecture/overview.md](docs/architecture/overview.md)
- ADRs: [docs/architecture/decisions/](docs/architecture/decisions/)

### Humo v2 ([ADR-0007](docs/architecture/decisions/ADR-0007-humo-v2.md))

- **Modelo puro determinista sin DOM** en `src/lib/smoke/model.ts`
  (`mulberry32`, `vnoise`, `createSmoke`/`stepSmoke` con curl 2D,
  `softAlphaBound`, `glyphFor`, `emit`); el render vive en
  `src/components/smoke-canvas.tsx` y el bus en
  `src/lib/smoke/emit-bus.ts`.
- **Capas L0–L4:** L0 `body::before` estático (fallback SSR/JS off/reduced),
  L1 humo suave (sprite radial, sin `filter: blur`), L2 ASCII tramado (matriz
  de Bayer), L3 zonificación y L4 coreografía por scroll.
- **Tiers adaptativos** Q3/Q2/Q1 (`count`/`cell`/`ascii`/`fps`/`res`) con
  nivel inicial por ancho, `hardwareConcurrency ≤ 4` como techo y degradación
  sostenida (> 24 ms durante 2 s) irreversible en la sesión; ahorro de datos
  (`Save-Data`/`prefers-reduced-data`) → Q0 (solo L0).
- Cotas de contraste verificadas en `src/data/contrast.test.ts`; guías de
  medición en `docs/guides/humo-baseline.md` (S0) y
  `docs/guides/humo-resultados.md` (S7).

### Rediseño neo-brutalista ([ADR-0008](docs/architecture/decisions/ADR-0008.md))

- **Identidad dual:** claro brutalista (borde tinta `--brut-border: 3px`, sombra
  dura desplazada, `border-radius: 0`) y oscuro neón (borde fino + halo en el
  color del tipo, `border-radius: 0.25rem`). Tipografías Archivo Black
  (titulares `h1–h3`), Space Mono (datos/glifos/etiquetas) y Public Sans
  (cuerpo), autoalojadas vía `@fontsource`.
- **Color por tipo:** 4 tipos (`dispositivo`/`resistencia`/`liquido`/
  `componente`) con tokens `--kind-*` y `--kind-color` por `data-kind`; el tipo
  se lee por color + icono + etiqueta (WCAG 1.4.1). Mapeo de `Domain` interno a
  `Kind` en `src/lib/kind.ts`.
- **Tarjetas `KindCard`** (`src/components/ui/kind-card.tsx`): LED tenue en
  espera, encendido con hover/foco; spotlight y tilt (≤ 4°) solo con
  `(hover:hover) and (pointer:fine)`. Modelo puro del tilt en
  `src/lib/fx/tilt.ts` (`tiltFromPointer`) y hook `useCardFx` en
  `src/components/ui/use-card-fx.ts`.
- **Tipografía cinética:** modelo puro `src/lib/kinetic/scramble.ts`
  (`scrambleFrame`/`scrambleFrames`, glifos `.·:~=+*#`); el componente
  `KineticHeading` superpone una capa `aria-hidden` solo en navegación cliente.
- **Transiciones vapor:** `defaultViewTransition` en `src/router.tsx` +
  `vapor-out`/`vapor-in` y puff de humo vía `emit-bus`.
- **Salvaguardas:** todo efecto se apaga con `prefers-reduced-motion` y el
  conmutador `vapelog-fx` (`src/lib/fx.ts`); `forced-colors` y
  `prefers-contrast: more` con estilo propio.

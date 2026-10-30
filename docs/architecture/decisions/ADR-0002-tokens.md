# ADR-0002 — Tokens OKLCH claro + oscuro

### Propósito de este documento

- **Objetivos:** Registrar el sistema de diseño semántico.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Los valores viven en `src/styles.css`.

## Estado

Aceptado

> **Nota (rediseño 2026):** reemplazado parcialmente por
> [ADR-0005](./ADR-0005-design-system-v2.md). Se mantienen la estrategia de
> clase `.dark` con script anti-FOUC y los nombres semánticos shadcn
> (`background`, `foreground`, `card`, `primary`, `muted`, `destructive`,
> `border`, `ring`, `chart-*`); cambian los valores concretos de los tokens,
> la escala de superficies/estados, los tokens de movimiento y humo, las
> fuentes autoalojadas y el tema en tres estados (Claro/Oscuro/Sistema).
>
> **Nota (cierre v2, 2026-10-30):** los valores concretos de neutros (tono
> ≈ 260), primario azul-grisáceo y `--kind-*` con croma 0,045 viven en
> [ADR-0017](./ADR-0017-paleta-neutra.md). Este ADR conserva el contrato de
> nombres y de clase `.dark`.

## Contexto

El tema original era solo oscuro con tokens legacy (`bg`, `fg`, `surface`).
Se pedía tema claro+oscuro completo estilo shadcn y contraste AA.

## Decisión

- Escala semántica shadcn en OKLCH (`background`, `foreground`, `card`,
  `primary`, `muted`, `destructive`, `border`, `ring`, `chart-*`, radios).
- Estrategia de clase `.dark` con script anti-FOUC y `localStorage`
  (`vapelog-theme`).
- Tests de contraste en ambos modos (`src/data/contrast.test.ts`).

## Consecuencias

- Componentes usan `bg-background`, `text-foreground`, `bg-card`, etc.
- El toggle vive en el header (`ui/theme-toggle.tsx`).

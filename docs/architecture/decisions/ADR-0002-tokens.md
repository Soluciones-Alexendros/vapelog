# ADR-0002 — Tokens OKLCH claro + oscuro

### Propósito de este documento

- **Objetivos:** Registrar el sistema de diseño semántico.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Los valores viven en `src/styles.css`.

## Estado

Aceptado

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

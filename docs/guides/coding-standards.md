# Guía — estándares de código

### Propósito de este documento

- **Objetivos:** Convenciones de estilo y estructura para PRs.
- **Estructura:** Lenguaje → UI → datos → commits.
- **Contenido a integrar según contexto:** No sustituye ESLint/Prettier.

## Lenguaje

- TypeScript strict; preferir tipos del dominio en `src/data/types.ts`.
- Español en copy de producto y docs contractuales.

## UI

- Tokens semánticos (`bg-background`, `text-muted-foreground`, …).
- Componentes en `src/components/ui/` con cva + Radix.
- No inventar datos en fichas.

## Datos

- Cambios de plantilla de ficha → `spec-def.ts` + tests + SQL público si aplica.
- Claves de storage: prefijo `vapelog-`.

## Commits

Conventional Commits. Un PR = un objetivo verificable.

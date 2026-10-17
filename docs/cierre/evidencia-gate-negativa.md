# Evidencia negativa del gate (`release-ready`)

### Propósito de este documento

- **Objetivos:** Registrar el ensayo VAL-003-01 (fallo unitario controlado
  en rama desechable) y la batería unitaria del agregador.
- **Estructura:** Ensayo unitario → rama desechable → resultado esperado.
- **Contenido a integrar según contexto:** No se deja el fallo en `main`.

## Ensayo unitario (local / CI del PR-A)

`scripts/release-ready.test.mjs` cubre:

- `failure` → gate rojo
- `skipped` → gate rojo
- `cancelled` → gate rojo
- todas en `success` → gate verde

Equivale a VAL-003-02 a nivel de agregador.

## Rama desechable (VAL-003-01)

Procedimiento:

1. Rama `ci/pr-a-gate-negative` desde el HEAD del PR-A.
2. Introducir un `assert.fail` en un test unitario existente.
3. Push **sin** abrir merge a `main`.
4. Observar que `release-ready` queda en rojo y que `release` no corre
   (solo se ejecuta en `main`).
5. Borrar la rama.

El resultado observado se anota al completar el push en la sesión PR-A.

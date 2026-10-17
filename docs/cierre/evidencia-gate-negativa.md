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

## Resultado observado (2026-10-17)

- PR desechable: https://github.com/Soluciones-Alexendros/vapelog/pull/16
- Run CI: `38987221994` (SHA `abc7c8ff1490b6c2d222878c68c24abec83c1515`)
- `test`: failure (assert intencional VAL-003-01)
- `supply-chain`: failure (gitleaks-action exigía licencia; sustituido por
  trufflehog fijado por SHA en el commit correctivo del PR-A)
- `release-ready`: failure (exit 2 / gate rojo)
- `release`: skipped (no corre fuera de `main`; no se ejecutó)

La rama `ci/pr-a-gate-negative` y el PR #16 se cierran/borran tras registrar
esta evidencia. No se fusiona a `main`.

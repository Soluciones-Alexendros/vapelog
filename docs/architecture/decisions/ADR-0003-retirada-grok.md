# ADR-0003 — Retirada de la maquinaria Grok

### Propósito de este documento

- **Objetivos:** Dejar constancia de la limpieza a catálogo puro.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** No reintroducir sin ADR nuevo.

## Estado

Aceptado

## Contexto

El workspace incluía auth/broker, multiplayer, middleware PWA Grok, scripts de
plataforma y carpetas `.grok` / `__grok`. El producto acordado es un catálogo
público sin cuentas.

## Decisión

- Eliminar auth, multiplayer, app-data, migrations Grok y scripts de
  plataforma. `write-atomic.mjs` (rutas legado `/workspace/.grok/`) se retira
  en la limpieza posterior por cero importadores.
- Conservar catálogo, fotos, lógica de cruce y calculadoras.
- Conservar los pases de navegador independientes de plataforma
  (`browser-smoke.mjs` + `browser-smoke-verdict.mjs` y `a11y-pass.mjs`) y
  ejecutarlos en CI en el job `browser`; `brand-check.mjs` se conserva
  ejercitado a través de `browser-smoke.mjs`.
- Renombrar marca visible a **Vapelog**.

## Consecuencias

- Sin variables de entorno obligatorias.
- `.env.example` es contrato vacío/documental.
- Cualquier reintroducción de auth o conectores requiere ADR y revisión de
  seguridad.

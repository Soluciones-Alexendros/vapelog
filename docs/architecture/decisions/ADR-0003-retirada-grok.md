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

- Eliminar auth, multiplayer, app-data, migrations Grok y scripts de plataforma.
- Conservar catálogo, fotos, lógica de cruce, calculadoras y smoke/brand/a11y.
- Renombrar marca visible a **Vapelog**.

## Consecuencias

- Sin variables de entorno obligatorias.
- `.env.example` es contrato vacío/documental.
- Cualquier reintroducción de auth o conectores requiere ADR y revisión de
  seguridad.

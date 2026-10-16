# ADR-0004 — Puerta de edad y contenido SSR

### Propósito de este documento

- **Objetivos:** Registrar el modelo de verificación de edad sobre contenido
  servido en SSR.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** No reintroducir un gate bloqueante
  en servidor sin ADR nuevo.

## Estado

Aceptado

## Contexto

El catálogo debe ser indexable: buscadores y enlaces necesitan el contenido en
el HTML servido, no tras una pantalla previa. La puerta de edad anterior
condicionaba la vista al diálogo de verificación, y los slugs inexistentes
respondían 200 con una ficha de error client-side.

## Decisión

- El contenido se sirve completo en SSR por indexabilidad.
- La verificación de edad es una capa client-side sobreimpresa: diálogo Radix
  («Tengo 18 años o más») que bloquea la interacción y solo se monta cuando
  falta la sesión (`sessionStorage` `vapelog-edad`).
- El acceso a `sessionStorage` pasa por `src/lib/browser-store.ts` con
  `try/catch`. Si `setItem` falla, la confirmación sigue abriendo el catálogo
  en memoria para esa visita; si `getItem` falla o no hay valor `ok`, se
  muestra la puerta.
- El rechazo («No tengo 18 años») deja el diálogo en estado de bloqueo sin
  abandonar el sitio.
- Los slugs inexistentes devuelven HTTP 404 reales con título por ficha.
- El smoke valida marcadores de contenido real por ruta y exige 404 en una
  ruta inexistente; CI añade pases de navegador (a11y + browser-smoke).

## Consecuencias

- El HTML público describe productos de vapeo: consecuencia aceptada para un
  catálogo informativo UE; no es tienda ni vende nicotina.
- Scripts y pases de navegador deben tolerar el SSR: `a11y-pass.mjs` atraviesa
  la puerta solo si aparece, y el exit code de `browser-smoke.mjs` incluye el
  pase extendido (tema oscuro y fichas).
- Sin almacenamiento persistente, la puerta reaparece en cada visita; eso es
  aceptable frente a bloquear el catálogo por un `setItem` fallido.

# ADR-0010 — Dominio canónico y redirección 308 desde beryl

### Propósito de este documento

- **Objetivos:** Fijar el host canónico de producción y la redirección
  permanente desde el alias `vapelog-beryl.vercel.app`.
- **Estructura:** Estado → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** `vercel.json`, `SITE_BASE` en
  `src/lib/seo.ts`, sitemap/robots y [ADR-0008](./ADR-0008.md).

## Estado

Aceptado (2026-09-30)

## Contexto

Existen dos hosts de Vercel: `vapelog-alexendros.vercel.app` (proyecto
actual) y `vapelog-beryl.vercel.app` (alias legado). El SEO y los
canonicals ya apuntan a alexendros (`SITE_BASE`, sitemap, OG). Sin un
308 host-condicionado, el tráfico a beryl fragmenta señales y deja
contenido duplicado indexable.

## Decisión

- **Canónico:** `https://vapelog-alexendros.vercel.app`.
- **Alias:** `vapelog-beryl.vercel.app` redirige con **308** a
  `https://vapelog-alexendros.vercel.app/:path*` mediante
  `vercel.json` → `redirects` con condición `has: [{ type: "host", value:
"vapelog-beryl.vercel.app" }]`.
- Caché: `/catalog/(.*)` y `/assets/(.*)` con `immutable` a largo plazo;
  HTML y resto con `must-revalidate`.

## Consecuencias

- Hay que desplegar `vercel.json` en el proyecto que sirve ambos hosts (o
  el que resuelve beryl) para que el 308 sea efectivo.
- Los canonicals y `VITE_SITE_URL` siguen en alexendros; no se introduce
  dominio propio sin ADR adicional.
- Verificación post-deploy: `curl -I https://vapelog-beryl.vercel.app/`
  debe devolver `308` y `Location` hacia alexendros.

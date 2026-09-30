# Guía — identidad de marca (v2)

### Propósito de este documento

- **Objetivos:** Inventariar los archivos de la marca Vapelog v2 y cómo regenerarlos.
- **Estructura:** Archivos → regeneración → licencia.
- **Contenido a integrar según contexto:** Fase N1 del plan neo-brutalista; no toca design system (N2).

## Archivos

- `public/logo.svg` — wordmark «Vapelog» a trazados, sin `<text>`, con voluta rectangular sobre la ele y bloque `prefers-color-scheme:dark`.
- `public/logo-mark.svg` — badge 32×32 (sombra en acento, V en inglete, voluta en acento) con bloque dark.
- `public/favicon.svg` — variante a sangre sin sombra, legible a 16 px, con bloque dark.
- `src/components/brand-mark.tsx` — `BrandLogo` (trazados con `currentColor` + `var(--logo-accent, #ffc400)`) y `BrandMark` (badge); la voluta se dibuja una vez por sesión (gate `vapelog-fx` + `prefers-reduced-motion`) y exhala en hover del enlace `.brand-link`.
- `scripts/build-logo.mjs` — fuente de verdad: trazados + paletas embebidos (sin opentype.js ni resvg).
- Derivados: `public/favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (zona segura 80 %), `public/site.webmanifest` y `public/og.jpg` (1200×630).

## Regeneración

```bash
node scripts/build-logo.mjs   # o `pnpm run logo` (script pendiente de cablear en package.json)
pnpm run icons
node scripts/brand-check.mjs  # exige logo.svg sin <text>, voluta y bloque dark en los 3 SVG
```

`build-logo.mjs` es idempotente y sale non-zero si falta la voluta, el bloque dark o aparece `<text>`.

## Licencia tipográfica

El wordmark deriva de Archivo Black y la futura N2 usa Space Mono; ambas son SIL Open Font License (OFL) y se autoalojan vía `@fontsource`. Los SVG distribuidos solo contienen trazados, sin fuentes incrustadas.

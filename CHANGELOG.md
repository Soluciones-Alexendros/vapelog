# Changelog

### Propósito de este documento

- **Objetivos:** Registrar cambios visibles por versión (Keep a Changelog).
- **Estructura:** Versiones en orden inverso cronológico.
- **Contenido a integrar según contexto:** Entradas en español; Conventional
  Commits alimentan el tono, no sustituyen este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [0.10.0] - 2026-09-30

### Cambios

- fix(fx): humo visible (fondo en `html`, body transparente) y fallo consultable (`vapelog-fx:v2`, Auto/On/Off, `?fx=debug`, `window.__vapelogFx`) (ADR-0009, F0)
- feat(fx): fotograma estático con `prefers-reduced-motion`; gobernador de tier con recuperación; carga diferida post-paint
- feat(humo): tiers Q3/Q2/Q1 en 87/54/32 bajo contrato de contraste (F2)
- test(fx): suite Playwright `pnpm run test:e2e` (humo + DOM budget) y job CI `fx-e2e`
- feat(catalogo): líquidos por resistencia con pestañas, 12+Ver N, filtro y nombres accesibles; SpecTable oculta vacíos (F5/F6)
- feat(nav): atajo Ctrl/Cmd+K en la paleta de comandos (F7)
- chore(seo): `vercel.json` 308 `beryl` → canónico; cache immutable de catálogo (ADR-0010)
- docs: `docs/plan-vapelog.md`, `docs/design-system.md`

## [0.9.1] - 2026-09-30

### Cambios

- fix(seo): canonical y og:url en home y buscador

## [0.9.0] - 2026-09-30

### Cambios

- feat(rediseno): identidad neo-brutalista con doble cara claro/oscuro — claro brutalista (borde tinta 3 px, sombra dura) y oscuro neón (borde fino + LED/glow) (ADR-0008)
- feat(marca): logo con voluta a trazados (sin `<text>`), favicon e iconos regenerados, wordmark tipográfico y animación de voluta (N1)
- feat(tipografia): Archivo Black en titulares y Space Mono en datos/etiquetas, autoalojadas vía `@fontsource` (N2)
- feat(tarjetas): `KindCard` con color por tipo (dispositivo/resistencia/líquido/componente), LED en espera/activo, spotlight y tilt ≤ 4° (N3)
- feat(cinetica): titulares con tipografía cinética `scramble` (glifos ASCII), solo en navegación cliente y con texto real en el DOM (N4)
- feat(terminal): caret tras el h1, prefijo `>` en el buscador, glitch al pulsar y línea de estado en el pie con cifras reales (N5)
- feat(transiciones): transiciones de página tipo vapor con puff de humo y degradación por `Save-Data`/`reduced-motion` (N6)
- feat(humo): tinte por tipo de ruta en oscuro dentro de los topes de `--smoke-alpha`/`--smoke-k` (N7)
- feat(accesibilidad): salvaguardas `prefers-reduced-motion`, conmutador `vapelog-fx`, `forced-colors` y `prefers-contrast: more` (N8)
- chore(dominio): dominio canónico unificado a `vapelog-alexendros.vercel.app` (N0)

## [0.8.0] - 2026-09-30

### Cambios

- feat(humo): fondo de humo v2 y cierre de deuda F2/F3/F4/F6/F7 (#8)
- refactor(herramientas): elimina cuadro Recomendación, mantiene línea Sugerido

## [0.8.0] - 2026-09-30

### Cambios

- feat(humo): humo v2 determinista con modelo puro sin DOM, capas L0–L4, híbrido humo suave + ASCII tramado y calidad adaptativa (ADR-0007)
- feat(identidad): favicon propio y BrandMark vectorial con adaptación al tema (F2)
- fix(movil): correcciones de F3 en móvil
- feat(ux): View Transitions, reveal, skeleton y contadores animados (F4)
- chore(lint): lint a 0 y anillo de foco consistente (F6)
- feat(navegacion): paleta ⌘K, preload y pie renovado (F7)

## [0.7.0] - 2026-09-29

### Cambios

- feat(herramientas): desplegable de ohmios con potencia recomendada y revisión de cruces
- refactor(catalogo): frases crudas a campos estructurados con datos oficiales

## [0.6.0] - 2026-09-29

### Cambios

- feat(catalogo): confianza fuera de fichas, header en 2 filas, carrusel de compatibilidad, bateria derivada e imagenes oficiales (#7)

## [0.5.0] - 2026-09-29

### Cambios

- feat(design-system): rediseño 2026 del catálogo (F0–F8) (#6)

## [0.4.1] - 2026-09-29

### Cambios

- fix(sitio): URL canonica de produccion a vapelog-alexendros.vercel.app (#5)

## [0.4.0] - 2026-09-29

### Cambios

- refactor(datos): modelo v3 que separa identidad, clasificación y variación, con géneros de líquido y nombres limpios sin sufijos de formato (#4)
- feat(datos): catálogo de 327 líquidos y 1078 variaciones de las 5 marcas oficiales, con taxonomía de sabores ampliada (#4)
- refactor(esquema): esquema SQL v3 con tabla `liquid_variation`, columna `genre` y `draws` unificado (#4)

## [0.3.0] - 2026-09-29

### Cambios

- fix(ci): linea en blanco entre secciones del CHANGELOG generado (#3)
- feat(blog): infraestructura de sección con artículos de opinión y estudio (#2)

## [0.2.0] - 2026-09-29

### Cambios

- feat(liquidos): modelo de variaciones y catálogo oficial de 5 marcas (#1)

## [0.1.0] - 2026-09-28

### Added

- Toolchain TanStack Start + Vite + pnpm con scripts canónicos P1.
- Sistema de tokens OKLCH claro/oscuro estilo shadcn y theme toggle.
- Fichas de producto estilo Kimovil (hero chips, accordion, relacionados).
- Documentación y CI P1+P2 (quality → test → build → smoke).
- Autorelease: `scripts/release.mjs` + job `release` en CI; semver desde
  Conventional Commits, tag y GitHub Release automáticos al llegar a `main`
  en verde. Deploy automático a producción en Vercel desde `main` (GitHub App).

### Changed

- Marca «Archivo 510» renombrada a **Vapelog**.
- Retirada de auth, multiplayer y maquinaria Grok; catálogo puro.

### Fixed

- Puerta de edad como capa client-side sobre contenido SSR (ADR-0004):
  el diálogo solo se monta cuando falta la sesión `vapelog-edad`.
- Slugs inexistentes devuelven HTTP 404 reales con título por ficha.
- Estado de «Líquido según la coil» reseteado al navegar entre fichas de
  dispositivo (`key` por slug).
- Ventana de potencia simétrica entre lógica TS y SQL de referencia.
- Ventana de ohmios por extremos y en ramas nativa/kit.
- Nicotina ≥10 mg también en RDL.
- 70/30 en MTL sin corte de ohmios.
- Clasificación de hilo/cerámica en faceta.
- Drip-tip 510 fuera del cruce genérico.
- Smoke con marcadores de contenido real por ruta y chequeo de 404.
- Job `browser` en CI (Playwright: a11y-pass + browser-smoke contra el
  build Nitro).
- Exit code de browser-smoke incluye el pase extendido (tema oscuro y
  fichas), con tests del veredicto.
- a11y-pass tolerante al SSR: atraviesa la puerta de edad solo si aparece.
- Init script de browser-smoke: `document.documentElement` a null en
  document_start (Playwright); la clase de tema la aplica el boot script.
- El diálogo de edad solo se monta cuando bloquea: montarlo cerrado y
  abrirlo después disparaba un race de react-remove-scroll.
- Skip-link con tokens inexistentes (`bg-focus`/`text-bg`).
- Error boundary y página 404 en español con tokens semánticos.
- Export CSV con BOM y en el orden activo de la tabla.
- `--destructive` oscuro ajustado a WCAG AA (4,9:1 con su primer plano);
  cobertura de contraste ampliada a todos los pares semánticos y
  `theme-color` acoplado a los tokens de fondo por test.

### Removed

- `scripts/write-atomic` (rutas legado `/workspace/.grok/`, cero
  importadores).
- Componentes ui huérfanos (tabs/tooltip/switch/skeleton).

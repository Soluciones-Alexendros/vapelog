# Changelog

### Propósito de este documento

- **Objetivos:** Registrar cambios visibles por versión (Keep a Changelog).
- **Estructura:** Versiones en orden inverso cronológico.
- **Contenido a integrar según contexto:** Entradas en español; Conventional
  Commits alimentan el tono, no sustituyen este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

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

# AGENTS.md

### Propósito de este documento

- **Objetivos:** Fijar el contrato operativo para agentes de código y el rol
  Mantenedor: fuentes de verdad, autonomía, comandos y Definition of Done.
- **Estructura:** Destinatarios → fuentes de verdad → unidad de trabajo →
  autonomía → stack y comandos → convenciones → layout → Definition of Done →
  §9 producto.
- **Contenido a integrar según contexto:** Adapta layout, scripts pnpm y
  umbrales de cobertura de este catálogo. No reintroduzcas auth, multiplayer
  ni broker Grok sin ADR. No inventes datos de fichas.

**Destinatarios:** agentes de código y el rol Mantenedor.  
**Propósito:** contrato operativo. Homogeneizamos **nombres y contratos**, no
el lenguaje ni la UI del producto.

## Fuentes de verdad (orden)

1. [README.md](./README.md)
2. Este archivo
3. [ARCHITECTURE.md](./ARCHITECTURE.md)
4. [docs/architecture/decisions/](./docs/architecture/decisions/)
5. [CONTRIBUTING.md](./CONTRIBUTING.md)
6. [SECURITY.md](./SECURITY.md)
7. [SUPPORT.md](./SUPPORT.md) y [docs/runbooks/](./docs/runbooks/)

No reinventes requisitos. Si falta ancla, paras y preguntas.

## Unidad de trabajo

```
Objetivo: <resultado verificable>
Traza: <ADR / issue / ruta>
Alcance: <archivos>
Exclusiones: <qué no harás>
Pruebas: pnpm test / pnpm run smoke
```

## Autonomía

- Puedes editar código, tests y docs del alcance acordado.
- No crees repos, ni pushes, ni compras, ni cambies DNS sin confirmación.
- No inventes especificaciones de producto: si la fuente no publica el dato,
  la casilla queda `Sin dato publicado`.

## Stack y comandos

- Node 22, pnpm, TanStack Start, React 19, Tailwind v4, OKLCH.
- `pnpm run typecheck` · `pnpm run lint` · `pnpm test` · `pnpm run build` ·
  `pnpm run smoke` · `make validate`.

## Convenciones

- Español en docs contractuales; Conventional Commits.
- Meta-sección «### Propósito de este documento» tras el H1 en `.md`
  contractuales.
- Tokens semánticos shadcn (`bg-background`, `text-foreground`, `bg-card`…).

## Layout

```
src/components/   UI y fichas
src/data/         catálogo tipado + lógica + tests
src/routes/       TanStack Router
public/catalog/   fotos
docs/             arquitectura, guías, runbooks
scripts/          smoke, check-env, brand-check, browser-smoke
```

## Definition of Done

- Typecheck, lint y tests verdes.
- Cobertura de líneas ≥ 70 % en el job `test` de CI.
- Build + smoke OK si tocas rutas o el shell.
- Docs/ADR actualizados si cambia arquitectura o contratos.

## §9 — Hechos de producto (Vapelog)

- Catálogo de referencia para adultos (UE/España). No es tienda ni vende
  nicotina.
- Dominios: dispositivos, resistencias (coils), líquidos, componentes.
- Marca visible: **Vapelog** (no «Archivo 510»). `archiveId` es identificador
  de ficha, no marca.
- Compatibilidad eléctrica/nativa/kit y calculadoras (nicokit) viven en
  `src/data/logic.ts` y rutas `/compatibilidad`, `/herramientas`.
- Temas claro y oscuro con clase `.dark` y persistencia `vapelog-theme`.
- Fuera de alcance salvo ADR: auth de usuarios, multiplayer, PWA Grok,
  conectores de plataforma.

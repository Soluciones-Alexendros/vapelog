# Guía — setup local

### Propósito de este documento

- **Objetivos:** Arrancar Vapelog en una máquina de desarrollo.
- **Estructura:** Requisitos → instalación → verificación.
- **Contenido a integrar según contexto:** Complementa [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Requisitos

- Node 22 (ver `.nvmrc`)
- pnpm 11+

## Instalación

```bash
pnpm install
pnpm dev
```

Abre la URL que imprime Vite (normalmente `http://localhost:3000`).

## Verificación

```bash
make validate
```

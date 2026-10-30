# Aceptación — migración visual v2 (U0–U9)

### Propósito de este documento

- **Objetivos:** Registrar la matriz mínima de aceptación manual, el SHA
  candidato y los gates locales del cierre U1–U8 según ADR-0017.
- **Estructura:** Candidato → gates → matriz → WCAG tocado → decisión.
- **Contenido a integrar según contexto:** No inventa datos de ficha. La
  aprobación humana de capturas cierra este expediente; `pnpm run a11y` no
  declara cumplimiento WCAG completo.

## Candidato

| Campo             | Valor                                                           |
| ----------------- | --------------------------------------------------------------- |
| Rama base         | `main`                                                          |
| SHA candidato     | `2581ee50187d3d8ffba9491b65f5bf95445218e0` (merge U8 / PR #40)  |
| Deploy producción | READY · mismo SHA · `dpl_GbafjyhuEi38EwmXxPwLVjaUtove`          |
| URL producción    | https://vapelog-alexendros.vercel.app                           |
| Contrato visual   | [ADR-0017](../architecture/decisions/ADR-0017-paleta-neutra.md) |

Comprobación Preview/prod = SHA candidato: el despliegue de producción en
Vercel para `main` apunta a `2581ee50…`, idéntico a `origin/main` al cerrar
U9. Cualquier Preview de PRs posteriores debe contrastarse otra vez.

## Unidades entregadas

| Unidad | PR  | Entrega                                                       |
| ------ | --- | ------------------------------------------------------------- |
| U1     | #32 | ADR-0017 (D1–D5), notas en ADR-0002 / ADR-0016 / overview     |
| U5     | #33 | Retirada de efectos muertos; migración única de `vapelog-fx`  |
| U6     | #34 | Sin blog de ejemplo; `/blog` → `/archivo`                     |
| U2     | #35 | Tokens tono 260, theme-color derivado, contraste ampliado     |
| U3     | #36 | JetBrains Mono Variable; Space Mono fuera                     |
| U4     | #38 | Nav principal, Comparador visible, Resultados, pie sin prompt |
| U7     | #39 | `/comparar?dominio=&fichas=` sobre localStorage               |
| U8     | #40 | Ohm sin sustitución; Nicokit sin defaults silenciosos         |

## Gates locales (U9)

Ejecutados en el cierre (Node 22):

- `pnpm run typecheck` — OK
- `pnpm run lint` — OK
- `pnpm run test:coverage` — OK (líneas ≥ 70 % en el ámbito CI)
- `pnpm run build` — OK
- `pnpm run smoke` — OK
- `pnpm run a11y` — OK (`violacionesSerias: 0`, 10 combinaciones)
- `pnpm run visual-smoke` — OK (30 combinaciones, sin fallos)

No se regeneró sitemap/images en masa (U6 ya ajustó el sitemap en su PR).

## Capturas Playwright

Índice y PNGs: [aceptacion-v2/capturas/indice.md](./aceptacion-v2/capturas/indice.md).
Las casillas ☐ de la matriz siguen siendo **visto bueno humano** tras revisar
esas imágenes; el script no declara cumplimiento WCAG ni cierra el expediente.

```bash
pnpm run build
pnpm run aceptacion:capturas
# opcional contra prod del SHA candidato:
# ACEPTACION_URL=https://vapelog-alexendros.vercel.app \
#   BROWSER_ALLOW_EXTERNAL_HOST=1 pnpm run aceptacion:capturas
```

## Matriz mínima (manual)

Recorridos: inicio, catálogo, ficha, comparador, buscar/resultados,
herramientas. Temas claro y oscuro. Móvil y escritorio. Estados normal,
vacío, error e incompleto. Teclado (Tab, foco visible, atajo Buscar).
Evidencia automática: `pnpm run aceptacion:capturas` (ver índice arriba).

| Superficie        | Claro | Oscuro | Móvil | Escritorio | Teclado | Notas                               |
| ----------------- | ----- | ------ | ----- | ---------- | ------- | ----------------------------------- |
| Inicio            | ☐     | ☐      | ☐     | ☐          | ☐       | Marca Vapelog, sin canvas FX        |
| Catálogo / lista  | ☐     | ☐      | ☐     | ☐          | ☐       | Nav principal + Resultados          |
| Ficha             | ☐     | ☐      | ☐     | ☐          | ☐       | Añadir al comparador no ensucia URL |
| Comparador        | ☐     | ☐      | ☐     | ☐          | ☐       | URL canónica; 0 / 1 / N fichas      |
| Buscar            | ☐     | ☐      | ☐     | ☐          | ☐       | Sin prompt `>`; truncado 20         |
| Herramientas Ohm  | ☐     | ☐      | ☐     | ☐          | ☐       | 0,804 Ω no se sustituye             |
| Herramientas Nico | ☐     | ☐      | ☐     | ☐          | ☐       | Vacío ≠ 0; tabs con flechas         |

## WCAG 2.2 AA (revisión manual en recorridos tocados)

| Comprobación                        | Estado |
| ----------------------------------- | ------ |
| Contraste (tests + muestreo visual) | ☐      |
| Foco no oculto por header sticky    | ☐      |
| Reflow 320 px / zoom 200 %          | ☐      |
| Objetivo táctil ≥ 24 px (ideal 44)  | ☐      |
| `prefers-reduced-motion`            | ☐      |
| `forced-colors`                     | ☐      |

## Rendimiento

Sin cifra antes/después con el mismo procedimiento del repo: **no se afirma
mejora**.

## Decisión

Pendiente de aprobación humana de capturas y recorridos. Gates de la
sección 9 del plan v2 en verde local; CI de `main` tras merge de U8 en verde
respecto al candidato.

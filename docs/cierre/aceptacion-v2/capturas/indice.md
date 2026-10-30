# Índice de capturas — aceptación visual v2

### Propósito de este documento

- **Objetivos:** Enlazar PNGs generados por `pnpm run aceptacion:capturas`
  con la matriz de [aceptacion-v2-visual.md](../aceptacion-v2-visual.md).
- **Estructura:** Cómo regenerar → tabla archivo → nota humana.
- **Contenido a integrar según contexto:** Regenerar con el script; no
  inventa datos de ficha. Las casillas ☐ del expediente las marca el
  operador tras revisar estas imágenes.

## Cómo regenerar

```bash
pnpm run build
pnpm run aceptacion:capturas
```

Base usada: `http://127.0.0.1:4178/`

## Archivos

| Superficie            | Tema   | Viewport   | Archivo                                                                              |
| --------------------- | ------ | ---------- | ------------------------------------------------------------------------------------ |
| Inicio                | claro  | movil      | [inicio-claro-movil.png](./inicio-claro-movil.png)                                   |
| Inicio                | claro  | escritorio | [inicio-claro-escritorio.png](./inicio-claro-escritorio.png)                         |
| Inicio                | oscuro | movil      | [inicio-oscuro-movil.png](./inicio-oscuro-movil.png)                                 |
| Inicio                | oscuro | escritorio | [inicio-oscuro-escritorio.png](./inicio-oscuro-escritorio.png)                       |
| Catálogo / lista      | claro  | movil      | [catalogo-claro-movil.png](./catalogo-claro-movil.png)                               |
| Catálogo / lista      | claro  | escritorio | [catalogo-claro-escritorio.png](./catalogo-claro-escritorio.png)                     |
| Catálogo / lista      | oscuro | movil      | [catalogo-oscuro-movil.png](./catalogo-oscuro-movil.png)                             |
| Catálogo / lista      | oscuro | escritorio | [catalogo-oscuro-escritorio.png](./catalogo-oscuro-escritorio.png)                   |
| Ficha                 | claro  | movil      | [ficha-claro-movil.png](./ficha-claro-movil.png)                                     |
| Ficha                 | claro  | escritorio | [ficha-claro-escritorio.png](./ficha-claro-escritorio.png)                           |
| Ficha                 | oscuro | movil      | [ficha-oscuro-movil.png](./ficha-oscuro-movil.png)                                   |
| Ficha                 | oscuro | escritorio | [ficha-oscuro-escritorio.png](./ficha-oscuro-escritorio.png)                         |
| Comparador (vacío)    | claro  | movil      | [comparar-0-claro-movil.png](./comparar-0-claro-movil.png)                           |
| Comparador (vacío)    | claro  | escritorio | [comparar-0-claro-escritorio.png](./comparar-0-claro-escritorio.png)                 |
| Comparador (vacío)    | oscuro | movil      | [comparar-0-oscuro-movil.png](./comparar-0-oscuro-movil.png)                         |
| Comparador (vacío)    | oscuro | escritorio | [comparar-0-oscuro-escritorio.png](./comparar-0-oscuro-escritorio.png)               |
| Comparador (1 ficha)  | claro  | movil      | [comparar-1-claro-movil.png](./comparar-1-claro-movil.png)                           |
| Comparador (1 ficha)  | claro  | escritorio | [comparar-1-claro-escritorio.png](./comparar-1-claro-escritorio.png)                 |
| Comparador (1 ficha)  | oscuro | movil      | [comparar-1-oscuro-movil.png](./comparar-1-oscuro-movil.png)                         |
| Comparador (1 ficha)  | oscuro | escritorio | [comparar-1-oscuro-escritorio.png](./comparar-1-oscuro-escritorio.png)               |
| Comparador (N fichas) | claro  | movil      | [comparar-n-claro-movil.png](./comparar-n-claro-movil.png)                           |
| Comparador (N fichas) | claro  | escritorio | [comparar-n-claro-escritorio.png](./comparar-n-claro-escritorio.png)                 |
| Comparador (N fichas) | oscuro | movil      | [comparar-n-oscuro-movil.png](./comparar-n-oscuro-movil.png)                         |
| Comparador (N fichas) | oscuro | escritorio | [comparar-n-oscuro-escritorio.png](./comparar-n-oscuro-escritorio.png)               |
| Buscar                | claro  | movil      | [buscar-claro-movil.png](./buscar-claro-movil.png)                                   |
| Buscar                | claro  | escritorio | [buscar-claro-escritorio.png](./buscar-claro-escritorio.png)                         |
| Buscar                | oscuro | movil      | [buscar-oscuro-movil.png](./buscar-oscuro-movil.png)                                 |
| Buscar                | oscuro | escritorio | [buscar-oscuro-escritorio.png](./buscar-oscuro-escritorio.png)                       |
| Buscar (resultados)   | claro  | movil      | [buscar-resultados-claro-movil.png](./buscar-resultados-claro-movil.png)             |
| Buscar (resultados)   | claro  | escritorio | [buscar-resultados-claro-escritorio.png](./buscar-resultados-claro-escritorio.png)   |
| Buscar (resultados)   | oscuro | movil      | [buscar-resultados-oscuro-movil.png](./buscar-resultados-oscuro-movil.png)           |
| Buscar (resultados)   | oscuro | escritorio | [buscar-resultados-oscuro-escritorio.png](./buscar-resultados-oscuro-escritorio.png) |
| Herramientas Ohm      | claro  | movil      | [ohm-claro-movil.png](./ohm-claro-movil.png)                                         |
| Herramientas Ohm      | claro  | escritorio | [ohm-claro-escritorio.png](./ohm-claro-escritorio.png)                               |
| Herramientas Ohm      | oscuro | movil      | [ohm-oscuro-movil.png](./ohm-oscuro-movil.png)                                       |
| Herramientas Ohm      | oscuro | escritorio | [ohm-oscuro-escritorio.png](./ohm-oscuro-escritorio.png)                             |
| Herramientas Nicokit  | claro  | movil      | [nicokit-claro-movil.png](./nicokit-claro-movil.png)                                 |
| Herramientas Nicokit  | claro  | escritorio | [nicokit-claro-escritorio.png](./nicokit-claro-escritorio.png)                       |
| Herramientas Nicokit  | oscuro | movil      | [nicokit-oscuro-movil.png](./nicokit-oscuro-movil.png)                               |
| Herramientas Nicokit  | oscuro | escritorio | [nicokit-oscuro-escritorio.png](./nicokit-oscuro-escritorio.png)                     |
| Teclado (foco Buscar) | claro  | movil      | [teclado-foco-claro-movil.png](./teclado-foco-claro-movil.png)                       |
| Teclado (foco Buscar) | claro  | escritorio | [teclado-foco-claro-escritorio.png](./teclado-foco-claro-escritorio.png)             |
| Teclado (foco Buscar) | oscuro | movil      | [teclado-foco-oscuro-movil.png](./teclado-foco-oscuro-movil.png)                     |
| Teclado (foco Buscar) | oscuro | escritorio | [teclado-foco-oscuro-escritorio.png](./teclado-foco-oscuro-escritorio.png)           |

Total: 44 capturas.

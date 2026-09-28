# Ingestión de catálogo (dispositivos 4 marcas)

Pasada **2C** (2026-09-28): solo modelos **activos** con specs publicadas en ficha oficial. Sin inventar campos: si falta → `null` / «Sin dato publicado» / «No publicada».

Marcas retenidas de dispositivo: Voopoo, Geekvape, Vaporesso, OXVA. Líquidos ajenos se conservan. Coils ajenas (Uwell / Innokin / Lost Mary) retiradas en 1B.

## Ya en catálogo (antes de esta pasada)

| Slug | Fuente |
|------|--------|
| `vaporesso-xros-4` | Distribuidores (ficha oficial unificada no fijada en semilla) |
| `vaporesso-luxe-x` | [LUXE X](https://www.vaporesso.com/series-product/luxe-x-series/luxe-x) |
| `oxva-xlim-pro-2` / `oxva-xlim-go-2` / `oxva-xlim-sq-pro-2` | oxva.com |
| `geekvape-aegis-legend-2` | Ficha / revisión citada en semilla |
| `voopoo-drag-x` | [Drag X](https://www.voopoo.com/drag-series/drag-x.html) |

## Inventario → volcado (esta pasada)

| Marca | URL oficial | Slug | Cubierto | Faltante / nota |
|-------|-------------|------|----------|-----------------|
| Vaporesso | [XROS 5](https://www.vaporesso.com/series-product/xros-series/xros5) | `vaporesso-xros-5` | 1500 mAh, Type-C 3A, 0,88" HD, 120×24,5×14,5 mm, 73,7 g, pods XROS | Techo W no listado como rango fijo en bloque Size; 0,4 Ω hasta 30 W en copy |
| Vaporesso | [XROS 6](https://www.vaporesso.com/series-product/xros-series/xros6) | `vaporesso-xros-6` | 1800 mAh, 30 W max, Type-C 9V/2A·5V/3A, 0,88" TFT, peso 65 g | — |
| Vaporesso | [LUXE XR MAX 2](https://www.vaporesso.com/series-product/luxe-x-series/luxe-xr-max-2) | `vaporesso-luxe-xr-max-2` | 3200 mAh, 5–80 W, Type-C 5V/2A, GTX, 108×32,1×26,4 mm, 117 g | — |
| Vaporesso | [LUXE X3](https://www.vaporesso.com/series-product/luxe-x-series/luxe-x3) | `vaporesso-luxe-x3` | 2600 mAh, 5–45 W, Type-C 5V/2A, pods LUXE X / GTX | — |
| Vaporesso | [ARMOUR G](https://www.vaporesso.com/series-product/armour-g-series/armour-g) | `vaporesso-armour-g` | 3000 mAh, 5–80 W, GTX, 113×38×28 mm | ARMOUR GS (18650) no es la misma ficha |
| Vaporesso | [ARMOUR OCTA](https://www.vaporesso.com/series-product/armour-series/armour-octa) | `vaporesso-armour-octa` | 220 W, 2×18650, Type-C, 510 + iTank T / GTi | — |
| Vaporesso | [PRIX](https://www.vaporesso.com/series-product/prix-kit/prix) | `vaporesso-prix` | 2600 mAh, 40 W max, pods PRIX 5,5 ml | Plataforma propia `prix` |
| Geekvape | [Aegis Hero 5](https://www.geekvape.com/product/aegis-hero-5/) | `geekvape-aegis-hero-5` | 50 W, 2000 mAh, 5V/2A, pod 6,5 ml, B coil | Dimensiones/peso no en extracto |
| Geekvape | [Wenax Q2](https://www.geekvape.com/product/wenax-q2/) | `geekvape-wenax-q2` | 1250 mAh, 5V/2A, Q pod | Max W no publicado en ficha |
| Geekvape | [Soul 2](https://www.geekvape.com/product/soul-2/) | `geekvape-soul-2` | 2100 mAh, 35 W max, 0,99" | Dimensiones no en extracto |
| Geekvape | [Digi Q Vista](https://www.geekvape.com/product/digi-q-vista/) | `geekvape-digi-q-vista` | 1600 mAh, 35 W max, Q pod 0,4 Ω | — |
| Geekvape | [Aegis Nano 3](https://www.geekvape.com/product/aegis-nano-3/) | `geekvape-aegis-nano-3` | 1600 mAh | Max W / carga no en extracto |
| Geekvape | [GEEKVAPE GO](https://www.geekvape.com/product/geekvape-go/) | `geekvape-go` | 1500 mAh | Max W no en extracto |
| Voopoo | [Drag 6](https://www.voopoo.com/drag-series/drag-6.html) | `voopoo-drag-6` | 5–220 W, 2×2200 mAh, GENE TT 3.0, 510 + PnP X | — |
| Voopoo | [Argus G4](https://www.voopoo.com/argus-series/argus-g4.html) | `voopoo-argus-g4` | 5–35 W, 1650 mAh, Type-C 5V/2A, Multi-Ohm | — |
| Voopoo | [Argus Z3](https://www.voopoo.com/argus-series/argus-z3.html) | `voopoo-argus-z3` | 1100 mAh, 41,6 g, Multi-Ohm 0,7/1,0 | Max W no en bloque Device Parameters del extracto |
| Voopoo | [VMATE MAX2](https://www.voopoo.com/v-series/vmate-max2.html) | `voopoo-vmate-max2` | 5–30 W, 2100 mAh, Type-C 5V/2A | — |
| Voopoo | [VRIZZ 2](https://www.voopoo.com/vrizz-series/vrizz-2.html) | `voopoo-vrizz-2` | 12–30 W, 1350 mAh, cartucho 15 ml | Formato gran depósito; TPD distinto |
| OXVA | [XLIM Pro 3](https://www.oxva.com/pages/xlim-pro-3) | `oxva-xlim-pro-3` | 5–30 W, 1500 mAh, 5V/2A, 1,05" HD | — |
| OXVA | [XLIM 3 Ultra](https://www.oxva.com/pages/xlim-3-ultra) | `oxva-xlim-3-ultra` | 5–30 W, 1500 mAh, 2,2" touch | — |
| OXVA | [NeXLIM 2](https://www.oxva.com/pages/nexlim-2) | `oxva-nexlim-2` | 5–40 W, 2000 mAh, 5V/3A, Unitech 3.0 | — |
| OXVA | [NeXLIM GO](https://www.oxva.com/pages/nexlim-go) | `oxva-nexlim-go` | 5–40 W, 1800 mAh, 5V/2A | — |
| OXVA | [XLIM GO Lite](https://www.oxva.com/pages/xlim-go-lite) | `oxva-xlim-go-lite` | 5–30 W, 1000 mAh, 5V/1A | — |

## Fuera de esta pasada (activos en web, sin volcar)

- Vaporesso: XROS 5/6 Mini, VIBE SE 2 (URL redirigió), ARMOUR G2, LUXE Q3, GEN/Target legacy.
- Geekvape: Sonder Q3 (ficha casi sin bloque de specs en HTML), Legend 5 (404 en geekvape.com), Wenax Q Ultra/Pro, AQ.
- Voopoo: Argus G4 mini, Drag X3/S3, Vinci activos sin ficha completa en esta extracción.
- OXVA: NeXLIM 2 Mini, Origin / Unipro (líneas antiguas o sin prioridad UE en esta pasada).
- Coils/líquidos «catálogo completo» de las 4 marcas.

## Plataformas nuevas registradas

`prix`, `pnp-x`, `argus`, `vmate`, `vrizz`, `nexlim`, `geekvape-soul`, `geekvape-nano`, `geekvape-go` (además de `xros`, `gtx`, `xlim`/`xlim-04`, `geekvape-b`, `geekvape-q`, `pnp` ya existentes).

import type {
  Brand,
  Coil,
  Device,
  Liquid,
  LiquidVariation,
  Part,
  Platform,
  Taxon,
  TpdStatus,
} from "./types";
import {
  extraBrands,
  extraCoils,
  extraDevices,
  extraParts,
  extraPlatforms,
  extraTaxa,
} from "./expansion.ts";
import { headCoils, headPlatforms, headTaxa } from "./heads.ts";
import { bomboLiquids } from "./liquids-bombo.ts";
import { drifterLiquids } from "./liquids-drifter.ts";
import { herreraLiquids } from "./liquids-herrera.ts";
import { kingsCrestLiquids } from "./liquids-kings-crest.ts";
import { oxvaLiquids } from "./liquids-oxva.ts";

export const brands: Brand[] = [
  { id: "vaporesso", name: "Vaporesso", country: "China" },
  { id: "oxva", name: "OXVA", country: "China" },
  { id: "geekvape", name: "Geekvape", country: "China" },
  { id: "vampire-vape", name: "Vampire Vape", country: "Reino Unido" },
  { id: "dinner-lady", name: "Dinner Lady", country: "Reino Unido" },
  { id: "nasty", name: "Nasty Juice", country: "Malasia" },
  { id: "just-juice", name: "Just Juice", country: "Reino Unido" },
  { id: "ivg", name: "IVG", country: "Reino Unido" },
  { id: "halo", name: "Halo", country: "Estados Unidos" },
  ...extraBrands,
];

export const platforms: Platform[] = [
  { id: "xros", name: "Vaporesso XROS" },
  { id: "xlim", name: "OXVA XLIM" },
  { id: "geekvape-z", name: "Geekvape Z" },
  ...extraPlatforms,
  ...headPlatforms,
];

export const taxa: Taxon[] = [
  { id: "pod", domain: "device", parentId: null, es: "Sistemas de cápsula", en: "Pod systems" },
  {
    id: "pod.abierto",
    domain: "device",
    parentId: "pod",
    es: "Pods abiertos rellenables",
    en: "Open refillable pods",
  },
  {
    id: "pod.sellado",
    domain: "device",
    parentId: "pod",
    es: "Cápsula sellada reemplazable",
    en: "Sealed replaceable pod",
  },
  { id: "pen", domain: "device", parentId: null, es: "Tubulares", en: "Pen-style" },
  {
    id: "pen.regulado",
    domain: "device",
    parentId: "pen",
    es: "Pen regulado",
    en: "Regulated pen",
  },
  { id: "mod", domain: "device", parentId: null, es: "Mods regulados", en: "Regulated mods" },
  {
    id: "mod.dual",
    domain: "device",
    parentId: "mod",
    es: "Dos celdas externas",
    en: "Dual external cells",
  },
  {
    id: "capsula",
    domain: "coil",
    parentId: null,
    es: "Cápsula con resistencia integrada",
    en: "Pod with built-in coil",
  },
  { id: "capsula.xros", domain: "coil", parentId: "capsula", es: "XROS", en: "XROS" },
  { id: "capsula.xlim", domain: "coil", parentId: "capsula", es: "XLIM", en: "XLIM" },
  { id: "tanque", domain: "coil", parentId: null, es: "Resistencia de tanque", en: "Tank coil" },
  { id: "tanque.z", domain: "coil", parentId: "tanque", es: "Serie Z", en: "Z series" },
  { id: "shortfill", domain: "liquid", parentId: null, es: "Shortfill 0 mg", en: "0 mg shortfill" },
  { id: "shortfill.50", domain: "liquid", parentId: "shortfill", es: "50 ml", en: "50 ml" },
  { id: "sal", domain: "liquid", parentId: null, es: "Sales de nicotina", en: "Nicotine salts" },
  { id: "sal.10", domain: "liquid", parentId: "sal", es: "10 ml", en: "10 ml" },
  { id: "freebase", domain: "liquid", parentId: null, es: "Freebase", en: "Freebase" },
  { id: "freebase.10", domain: "liquid", parentId: "freebase", es: "10 ml", en: "10 ml" },
  { id: "aroma", domain: "liquid", parentId: null, es: "Aromas concentrados", en: "Concentrates" },
  { id: "frutal", domain: "flavor", parentId: null, es: "Frutal", en: "Fruit" },
  { id: "frutal.bayas", domain: "flavor", parentId: "frutal", es: "Bayas", en: "Berries" },
  { id: "frutal.citricos", domain: "flavor", parentId: "frutal", es: "Cítricos", en: "Citrus" },
  {
    id: "frutal.tropicales",
    domain: "flavor",
    parentId: "frutal",
    es: "Tropicales",
    en: "Tropical",
  },
  { id: "postre", domain: "flavor", parentId: null, es: "Postre", en: "Dessert" },
  { id: "postre.tarta", domain: "flavor", parentId: "postre", es: "Tartas", en: "Tarts" },
  { id: "tabaco", domain: "flavor", parentId: null, es: "Tabaco", en: "Tobacco" },
  { id: "tabaco.rubio", domain: "flavor", parentId: "tabaco", es: "Rubio", en: "Virginia-style" },
  { id: "menta", domain: "flavor", parentId: null, es: "Mentolado", en: "Menthol" },
  { id: "menta.frio", domain: "flavor", parentId: "menta", es: "Frío", en: "Ice" },
  { id: "complejo", domain: "flavor", parentId: null, es: "Complejo", en: "Complex" },
  { id: "complejo.anisado", domain: "flavor", parentId: "complejo", es: "Anisado", en: "Anise" },
  ...extraTaxa,
  ...headTaxa,
];

const xrosSources = [
  {
    label: "Ecigone — ficha XROS 4",
    url: "https://ecigone.co.uk/products/vaporesso-xros-4-pod-vape-kit",
  },
  {
    label: "Vape Superstore — ficha XROS 4",
    url: "https://www.vapesuperstore.co.uk/products/xros-4-pod-kit-by-vaporesso",
  },
];

const xlimSources = [
  {
    label: "OXVA — PDF técnico XLIM Pro 2",
    url: "https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_PRO_2_Techspec.pdf?v=1721370707",
  },
];

const l200Sources = [
  {
    label: "Vaping Hardware — revisión L200",
    url: "https://vapinghardware.com/geek-vape-l200-aegis-legend-2-kit-review/",
  },
];

const zSources = [
  {
    label: "Geekvape — PDF de coils",
    url: "https://cdn.shopify.com/s/files/1/1726/8617/files/Geekvape_Coils_Cartridges_specification.pdf?v=1716416025",
  },
  {
    label: "Geekvape Store — FAQ serie Z",
    url: "https://store.geekvape.com/blogs/faq-products/faq-geekvape-z-series-coil",
  },
];

export const devices: Device[] = [
  {
    domain: "device",
    id: "xros-4",
    slug: "vaporesso-xros-4",
    archiveId: "A510-DEV-XROS4",
    brandId: "vaporesso",
    name: "XROS 4",
    familyId: "pod",
    subId: "pod.abierto",
    format: "Pod",
    summary:
      "Pod abierto recargable de la serie XROS, documentado en distribución UE con batería integrada de 1000 mAh, salida de 5 a 30 W y cápsulas TPD de 2 ml.",
    confidence: "distribuidor",
    sources: xrosSources,
    caveats: [
      "No se localizó una ficha única de Vaporesso en esta pasada. Las cifras salen de distribuidores especializados y no coinciden en pantalla ni en milímetros.",
      "Un distribuidor describe pantalla a color; otro, indicador LED. El archivo no fija el tamaño del display.",
      "Las alturas publicadas van de 107,5 mm a 120,8 mm. No se elige una sola cifra.",
      "Existen cápsulas de mayor capacidad fuera del formato TPD de 2 ml. Esta ficha describe la versión de 2 ml.",
    ],
    tags: ["pod", "mtl", "rdl", "usb-c", "tpd", "xros"],
    status: "referenciado",
    battery: "1000 mAh integrada",
    charge: "USB-C, hasta 2 A",
    power: "5–30 W",
    powerMinW: 5,
    powerMaxW: 30,
    ohmMin: 0.4,
    ohmMax: 1.2,
    chipset: "AXON (citado por distribuidores)",
    modes: ["Varios niveles de salida", "Calada o botón"],
    display: "Indicador de batería y modo; tipo de pantalla no unificado",
    connector: "propietario",
    platformIds: ["xros"],
    kitPlatformIds: [],
    materials: "Aluminio en el cuerpo, según distribuidores",
    airflow: "Corredera ajustable, de MTL a RDL",
    capacity: "2 ml en el formato TPD citado",
    dimensions: "No unificadas entre fuentes (ancho citado 24 mm)",
    weight: "53 g en una ficha de distribuidor",
    tpd: "si",
    year: null,
    draw: "MTL y RDL, según la cápsula",
  },
  {
    domain: "device",
    id: "xlim-pro-2",
    slug: "oxva-xlim-pro-2",
    archiveId: "A510-DEV-XLIMPRO2",
    brandId: "oxva",
    name: "XLIM Pro 2",
    familyId: "pod",
    subId: "pod.abierto",
    format: "Pod",
    summary:
      "Pod abierto de OXVA. El PDF técnico del fabricante fija 1300 mAh, 5–30 W, pantalla de 0,56 pulgadas y cartucho de 2 ml en versión TPD.",
    confidence: "fabricante",
    sources: xlimSources,
    caveats: [
      "El PDF lista cartuchos XLIM de 0,4, 0,6, 0,8 y 1,2 Ω. El rango de vatios de cada una no está en ese PDF; si aparece en una ficha de coil, va marcado aparte.",
      "El peso del PDF es 67 g. Una tienda francesa cita 66 g.",
    ],
    tags: ["pod", "mtl", "rdl", "usb-c", "tpd", "xlim"],
    status: "referenciado",
    battery: "1300 mAh integrada",
    charge: "USB-C, 5 V / 2 A",
    power: "5–30 W",
    powerMinW: 5,
    powerMaxW: 30,
    ohmMin: 0.3,
    ohmMax: 3,
    chipset: null,
    modes: ["Potencia regulable"],
    display: "Pantalla HD de 0,56 pulgadas",
    connector: "propietario",
    platformIds: ["xlim", "xlim-04"],
    kitPlatformIds: [],
    materials: "Aleación de zinc, efecto piel artificial, PCTG",
    airflow: "Ajuste de aire en el pod",
    capacity: "2 ml en versión TPD",
    dimensions: "114,5 × 25 × 15 mm",
    weight: "67 g",
    tpd: "si",
    year: null,
    draw: "MTL y RDL, según el cartucho",
  },
  {
    domain: "device",
    id: "l200",
    slug: "geekvape-aegis-legend-2",
    archiveId: "A510-DEV-L200",
    brandId: "geekvape",
    name: "Aegis Legend 2 (L200)",
    familyId: "mod",
    subId: "mod.dual",
    format: "Box mod",
    summary:
      "Mod regulado de dos 18650, hasta 200 W, con conector 510. El kit de revisión consultado incluye el tanque Z sub-ohm; el mod en sí no está atado a una sola coil.",
    confidence: "ficha",
    sources: l200Sources,
    caveats: [
      "Una FAQ de tienda atribuye al L200 una sola 18650. Contradice la revisión técnica usada aquí y el diseño conocido del Legend 2. Esta ficha mantiene dos 18650 y lo marca como conflicto de fuente.",
      "El cristal de burbuja de 5,5 ml citado en catálogos no cumple el límite TPD de 2 ml. Varios kits UE incluyen un cristal de recambio de 2 ml.",
      "Los 45 A máximos publicados no sirven para elegir una celda. Hay que mirar el CDR de la batería y la ley de Ohm del montaje real.",
      "No se copia un grado IP: no estaba en la revisión citada.",
    ],
    tags: ["mod", "18650", "dual", "510", "200w", "tc"],
    status: "referenciado",
    battery: "Dos 18650 externas, no incluidas",
    charge: "USB-C 5 V / 2 A, o carga externa de las celdas",
    power: "5–200 W",
    powerMinW: 5,
    powerMaxW: 200,
    ohmMin: 0.1,
    ohmMax: 3,
    chipset: "AS",
    modes: ["Potencia", "Curva VPC", "TC Ni/Ti/SS", "TCR", "Bypass"],
    display: "TFT a color de 1,08 pulgadas",
    connector: "510",
    platformIds: [],
    kitPlatformIds: ["geekvape-z"],
    materials: "No desglosados en la revisión citada",
    airflow: "Depende del atomizador montado",
    capacity: "El mod no tiene depósito. El tanque del kit sí.",
    dimensions: "140 × 54,12 × 29 mm",
    weight: "140 g sin baterías",
    tpd: "parcial",
    year: 2021,
    draw: "La marca el atomizador, no el mod",
  },
  ...extraDevices,
];

export const coils: Coil[] = [
  coilPod(
    "xros-04",
    "xros-corex-0-4",
    "A510-COIL-XROS04",
    "vaporesso",
    "XROS 0,4 Ω",
    "capsula",
    "capsula.xros",
    ["xros"],
    0.4,
    "RDL",
    "Cápsula XROS de 0,4 Ω para una calada más abierta. El dispositivo XROS 4 la admite dentro de su techo de 30 W.",
    null,
    null,
    null,
  ),
  coilPod(
    "xros-06",
    "xros-corex-0-6",
    "A510-COIL-XROS06",
    "vaporesso",
    "XROS 0,6 Ω",
    "capsula",
    "capsula.xros",
    ["xros"],
    0.6,
    "RDL",
    "Cápsula XROS de 0,6 Ω, descrita por distribuidores como MTL holgado o RDL suave.",
    null,
    null,
    null,
  ),
  coilPod(
    "xros-08",
    "xros-corex-0-8",
    "A510-COIL-XROS08",
    "vaporesso",
    "XROS 0,8 Ω",
    "capsula",
    "capsula.xros",
    ["xros"],
    0.8,
    "MTL",
    "Cápsula XROS de 0,8 Ω, la referencia MTL más citada para sales en esta serie.",
    null,
    null,
    null,
  ),
  coilPod(
    "xros-10",
    "xros-corex-1-0",
    "A510-COIL-XROS10",
    "vaporesso",
    "XROS 1,0 Ω",
    "capsula",
    "capsula.xros",
    ["xros"],
    1.0,
    "MTL",
    "Cápsula XROS de 1,0 Ω para MTL cerrado.",
    null,
    null,
    null,
  ),
  coilPod(
    "xros-12",
    "xros-corex-1-2",
    "A510-COIL-XROS12",
    "vaporesso",
    "XROS 1,2 Ω",
    "capsula",
    "capsula.xros",
    ["xros"],
    1.2,
    "MTL",
    "Cápsula XROS de 1,2 Ω, la más cerrada de la serie citada.",
    null,
    null,
    null,
  ),
  {
    ...coilPod(
      "xlim-04",
      "xlim-0-4",
      "A510-COIL-XLIM04",
      "oxva",
      "XLIM 0,4 Ω",
      "capsula",
      "capsula.xlim",
      ["xlim-04"],
      0.4,
      "RDL",
      "Cartucho XLIM de 0,4 Ω. OXVA lo recomienda a 26–30 W, RDL, y no en todos los kits antiguos de la serie.",
      26,
      30,
      "fabricante",
    ),
    sources: [
      {
        label: "OXVA — cartucho XLIM",
        url: "https://www.oxva.com/es/pages/xlim-refillable-cartridge",
      },
    ],
    caveats: [
      "OXVA indica que XLIM SE, XLIM SQ y XLIM Pod no aceptan el cartucho de 0,4 Ω. Pro 2, SQ Pro 2 y Go 2 sí están en la lista de compatibles de la página de cartuchos.",
    ],
    confidence: "fabricante",
  },
  {
    ...coilPod(
      "xlim-06",
      "xlim-0-6",
      "A510-COIL-XLIM06",
      "oxva",
      "XLIM 0,6 Ω",
      "capsula",
      "capsula.xlim",
      ["xlim"],
      0.6,
      "RDL",
      "Cartucho XLIM de 0,6 Ω. OXVA lo sitúa en 20–25 W, entre MTL y RDL.",
      20,
      25,
      "fabricante",
    ),
    sources: [
      {
        label: "OXVA — cartucho XLIM",
        url: "https://www.oxva.com/es/pages/xlim-refillable-cartridge",
      },
    ],
    caveats: ["Ventana de vatios tomada de la página de cartuchos, no del PDF del Pro 2."],
    confidence: "fabricante",
  },
  {
    ...coilPod(
      "xlim-08",
      "xlim-0-8",
      "A510-COIL-XLIM08",
      "oxva",
      "XLIM 0,8 Ω",
      "capsula",
      "capsula.xlim",
      ["xlim"],
      0.8,
      "MTL",
      "Cartucho XLIM de 0,8 Ω para sales en MTL. OXVA lo sitúa en 12–16 W.",
      12,
      16,
      "fabricante",
    ),
    sources: [
      {
        label: "OXVA — cartucho XLIM",
        url: "https://www.oxva.com/es/pages/xlim-refillable-cartridge",
      },
    ],
    caveats: ["Ventana de vatios tomada de la página de cartuchos, no del PDF del Pro 2."],
    confidence: "fabricante",
  },
  {
    ...coilPod(
      "xlim-12",
      "xlim-1-2",
      "A510-COIL-XLIM12",
      "oxva",
      "XLIM 1,2 Ω",
      "capsula",
      "capsula.xlim",
      ["xlim"],
      1.2,
      "MTL",
      "Cartucho XLIM de 1,2 Ω para MTL cerrado con sales. OXVA lo sitúa en 10–12 W.",
      10,
      12,
      "fabricante",
    ),
    sources: [
      {
        label: "OXVA — cartucho XLIM",
        url: "https://www.oxva.com/es/pages/xlim-refillable-cartridge",
      },
    ],
    caveats: ["Ventana de vatios tomada de la página de cartuchos, no del PDF del Pro 2."],
    confidence: "fabricante",
  },
  {
    domain: "coil",
    id: "z-02",
    slug: "geekvape-z-0-2",
    archiveId: "A510-COIL-Z02",
    brandId: "geekvape",
    name: "Z 0,2 Ω",
    familyId: "tanque",
    subId: "tanque.z",
    summary:
      "Coil de malla 0,2 Ω de la serie Z. El PDF de Geekvape la sitúa en 70–80 W y la asocia al tanque Z sub-ohm y al kit L200, entre otros.",
    confidence: "fabricante",
    sources: zSources,
    caveats: [
      "La serie Z no es universal entre todos los tanques de la marca. Esta ficha sigue el PDF: tanque Z y kit L200.",
      "La FAQ de la marca describe la Z 0,2 como malla simple, frente a la 0,25 de doble malla.",
    ],
    tags: ["z", "mesh", "dl", "510", "subohm"],
    status: "referenciado",
    platformIds: ["geekvape-z"],
    ohms: 0.2,
    wattMin: 70,
    wattMax: 80,
    wattConfidence: "fabricante",
    wire: "Malla simple",
    build: "Malla",
    draw: "DL",
    connector: "510",
    refillable: true,
    pack: "No fijado en el PDF citado",
  },
  {
    domain: "coil",
    id: "z-025",
    slug: "geekvape-z-0-25",
    archiveId: "A510-COIL-Z025",
    brandId: "geekvape",
    name: "Z 0,25 Ω",
    familyId: "tanque",
    subId: "tanque.z",
    summary:
      "Coil de doble malla a 0,25 Ω. El PDF la sitúa en 45–57 W y la asocia al kit L200. La FAQ la distingue de la 0,2 de malla simple.",
    confidence: "fabricante",
    sources: zSources,
    caveats: [
      "El PDF excluye esta resistencia de algunos tanques P sub-ohm. No asumir que toda coil Z entra en todo tanque Z.",
    ],
    tags: ["z", "mesh", "dl", "510"],
    status: "referenciado",
    platformIds: ["geekvape-z"],
    ohms: 0.25,
    wattMin: 45,
    wattMax: 57,
    wattConfidence: "fabricante",
    wire: "Doble malla",
    build: "Doble malla",
    draw: "DL",
    connector: "510",
    refillable: true,
    pack: "No fijado en el PDF citado",
  },
  {
    domain: "coil",
    id: "z-04",
    slug: "geekvape-z-0-4",
    archiveId: "A510-COIL-Z04",
    brandId: "geekvape",
    name: "Z 0,4 Ω",
    familyId: "tanque",
    subId: "tanque.z",
    summary:
      "Coil Z de 0,4 Ω recomendada a 50–60 W en la FAQ y en el PDF. El PDF la asocia al tanque Z sub-ohm.",
    confidence: "fabricante",
    sources: zSources,
    caveats: [
      "En el kit L200 entra porque ese kit monta el tanque Z, no porque la coil se conecte al mod.",
    ],
    tags: ["z", "mesh", "dl", "510"],
    status: "referenciado",
    platformIds: ["geekvape-z"],
    ohms: 0.4,
    wattMin: 50,
    wattMax: 60,
    wattConfidence: "fabricante",
    wire: "Malla",
    build: "Malla",
    draw: "DL",
    connector: "510",
    refillable: true,
    pack: "No fijado en el PDF citado",
  },
  ...extraCoils,
  ...headCoils,
];

function coilPod(
  id: string,
  slug: string,
  archiveId: string,
  brandId: string,
  name: string,
  familyId: string,
  subId: string,
  platformIds: string[],
  ohms: number,
  draw: Coil["draw"],
  summary: string,
  wattMin: number | null,
  wattMax: number | null,
  wattConfidence: Coil["wattConfidence"],
): Coil {
  return {
    domain: "coil",
    id,
    slug,
    archiveId,
    brandId,
    name,
    familyId,
    subId,
    summary,
    confidence: "distribuidor",
    sources: brandId === "vaporesso" ? xrosSources : [],
    caveats:
      wattMin == null
        ? [
            "No se publica un rango de vatios propio. El techo es el del dispositivo de esa plataforma.",
          ]
        : [],
    tags: [draw.toLowerCase(), `${ohms}ohm`, brandId],
    status: "referenciado",
    platformIds,
    ohms,
    wattMin,
    wattMax,
    wattConfidence,
    wire: "Malla integrada en la cápsula; aleación no unificada en las fuentes de esta ficha",
    build: "Malla integrada",
    draw,
    connector: "propietario",
    refillable: true,
    pack: "El blister no es único entre tiendas; no se fija un número de unidades",
  };
}

const unverifiedLiquid = [
  "Nombre comercial estable en el mercado UE. Esta ficha no reproduce una etiqueta concreta.",
  "Volumen, graduación y ratio son los habituales del formato. Hay que leer el envase del lote.",
  "SUPUESTO NO VERIFICADO: no se adjunta aquí un número de notificación TPD ni un código UFI.",
];

export const liquids: Liquid[] = [
  {
    domain: "liquid",
    id: "heisenberg-sal",
    slug: "vampire-vape-heisenberg-sales",
    archiveId: "A510-LIQ-HEIS-20",
    brandId: "vampire-vape",
    name: "Heisenberg sales 20 mg",
    line: "Heisenberg",
    familyId: "sal",
    subId: "sal.10",
    summary:
      "Sales de nicotina del líquido Heisenberg en formato TPD de 10 ml a 20 mg/ml. Perfil de frutos azules, dulce y un fondo anisado frío.",
    confidence: "distribuidor",
    sources: [],
    caveats: unverifiedLiquid,
    tags: ["sales", "10ml", "20mg", "heisenberg", "mtl"],
    status: "referenciado",
    flavorIds: ["frutal.bayas", "menta.frio", "complejo.anisado"],
    recommendedDraw: ["MTL", "RDL"],
    variations: [
      {
        id: "heisenberg-sal-20",
        label: "20 mg/ml · 10 ml",
        format: "sales",
        volumeMl: 10,
        nicotineMg: 20,
        nicotineType: "sal",
        ratio: "50/50",
        bottle: "10 ml listo para vapear",
        assumedBottleMl: 10,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "heisenberg-short",
    slug: "vampire-vape-heisenberg-shortfill",
    archiveId: "A510-LIQ-HEIS-50",
    brandId: "vampire-vape",
    name: "Heisenberg shortfill",
    line: "Heisenberg",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Shortfill sin nicotina del mismo perfil Heisenberg, en el formato habitual de 50 ml con espacio para nicokit.",
    confidence: "distribuidor",
    sources: [],
    caveats: [
      ...unverifiedLiquid,
      "El hueco libre depende de la botella. La calculadora asume 60 ml totales solo como punto de partida.",
    ],
    tags: ["shortfill", "0mg", "heisenberg"],
    status: "referenciado",
    flavorIds: ["frutal.bayas", "menta.frio", "complejo.anisado"],
    recommendedDraw: ["MTL", "RDL", "DL"],
    variations: [
      {
        id: "heisenberg-short-0",
        label: "0 mg/ml · 50 ml",
        format: "shortfill",
        volumeMl: 50,
        nicotineMg: 0,
        nicotineType: "ninguna",
        ratio: null,
        bottle: "Shortfill con espacio para nicokit",
        assumedBottleMl: 60,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "lemon-tart-short",
    slug: "dinner-lady-lemon-tart-shortfill",
    archiveId: "A510-LIQ-LT-50",
    brandId: "dinner-lady",
    name: "Lemon Tart shortfill",
    line: "Lemon Tart",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Shortfill 0 mg de tarta de limón, línea clásica de Dinner Lady, en el formato habitual de 50 ml.",
    confidence: "distribuidor",
    sources: [],
    caveats: unverifiedLiquid,
    tags: ["shortfill", "postre", "limon"],
    status: "referenciado",
    flavorIds: ["postre.tarta", "frutal.citricos"],
    recommendedDraw: ["RDL", "DL"],
    variations: [
      {
        id: "lemon-tart-short-0",
        label: "0 mg/ml · 50 ml",
        format: "shortfill",
        volumeMl: 50,
        nicotineMg: 0,
        nicotineType: "ninguna",
        ratio: null,
        bottle: "Shortfill con espacio para nicokit",
        assumedBottleMl: 60,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "lemon-tart-sal",
    slug: "dinner-lady-lemon-tart-sales",
    archiveId: "A510-LIQ-LT-20",
    brandId: "dinner-lady",
    name: "Lemon Tart sales 20 mg",
    line: "Lemon Tart",
    familyId: "sal",
    subId: "sal.10",
    summary: "La misma tarta de limón en sales de 10 ml a 20 mg/ml, formato de venta TPD.",
    confidence: "distribuidor",
    sources: [],
    caveats: unverifiedLiquid,
    tags: ["sales", "10ml", "20mg", "postre"],
    status: "referenciado",
    flavorIds: ["postre.tarta", "frutal.citricos"],
    recommendedDraw: ["MTL", "RDL"],
    variations: [
      {
        id: "lemon-tart-sal-20",
        label: "20 mg/ml · 10 ml",
        format: "sales",
        volumeMl: 10,
        nicotineMg: 20,
        nicotineType: "sal",
        ratio: "50/50",
        bottle: "10 ml listo para vapear",
        assumedBottleMl: 10,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "bad-blood",
    slug: "nasty-juice-bad-blood-shortfill",
    archiveId: "A510-LIQ-BB-50",
    brandId: "nasty",
    name: "Bad Blood shortfill",
    line: "Bad Blood",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary: "Shortfill 0 mg de frutos rojos de Nasty Juice, en el formato habitual de 50 ml.",
    confidence: "distribuidor",
    sources: [],
    caveats: unverifiedLiquid,
    tags: ["shortfill", "frutos rojos"],
    status: "referenciado",
    flavorIds: ["frutal.bayas"],
    recommendedDraw: ["RDL", "DL"],
    variations: [
      {
        id: "bad-blood-0",
        label: "0 mg/ml · 50 ml",
        format: "shortfill",
        volumeMl: 50,
        nicotineMg: 0,
        nicotineType: "ninguna",
        ratio: null,
        bottle: "Shortfill con espacio para nicokit",
        assumedBottleMl: 60,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "mango",
    slug: "just-juice-mango-passion-sales",
    archiveId: "A510-LIQ-JJ-20",
    brandId: "just-juice",
    name: "Mango & Passion Fruit sales",
    line: "Mango & Passion Fruit",
    familyId: "sal",
    subId: "sal.10",
    summary:
      "Sales de mango y fruta de la pasión en 10 ml. Graduación habitual de lineal: 10 o 20 mg/ml. Esta ficha usa 20 mg como referencia TPD, no como único SKU.",
    confidence: "distribuidor",
    sources: [],
    caveats: [
      ...unverifiedLiquid,
      "Just Juice vende más de una graduación. 20 mg/ml es la referencia elegida, no la única.",
    ],
    tags: ["sales", "tropical", "10ml"],
    status: "referenciado",
    flavorIds: ["frutal.tropicales"],
    recommendedDraw: ["MTL", "RDL"],
    variations: [
      {
        id: "mango-20",
        label: "20 mg/ml · 10 ml",
        format: "sales",
        volumeMl: 10,
        nicotineMg: 20,
        nicotineType: "sal",
        ratio: "50/50",
        bottle: "10 ml listo para vapear",
        assumedBottleMl: 10,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "ivg-blue",
    slug: "ivg-blue-raspberry-sales",
    archiveId: "A510-LIQ-IVG-20",
    brandId: "ivg",
    name: "Blue Raspberry sales",
    line: "Blue Raspberry",
    familyId: "sal",
    subId: "sal.10",
    summary: "Sales de frambuesa azul de IVG en 10 ml a 20 mg/ml, con frío. Formato de lineal TPD.",
    confidence: "distribuidor",
    sources: [],
    caveats: unverifiedLiquid,
    tags: ["sales", "ice", "10ml", "20mg"],
    status: "referenciado",
    flavorIds: ["frutal.bayas", "menta.frio"],
    recommendedDraw: ["MTL", "RDL"],
    variations: [
      {
        id: "ivg-blue-20",
        label: "20 mg/ml · 10 ml",
        format: "sales",
        volumeMl: 10,
        nicotineMg: 20,
        nicotineType: "sal",
        ratio: "50/50",
        bottle: "10 ml listo para vapear",
        assumedBottleMl: 10,
        tpd: "si",
      },
    ],
  },
  {
    domain: "liquid",
    id: "tribeca",
    slug: "halo-tribeca",
    archiveId: "A510-LIQ-TRIBECA",
    brandId: "halo",
    name: "Tribeca",
    line: "Tribeca",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Freebase de tabaco rubio de Halo en 10 ml. Las graduaciones históricas de lineal incluyen varios escalones por debajo de 20 mg/ml. Esta ficha usa 12 mg/ml como referencia, no como único SKU.",
    confidence: "distribuidor",
    sources: [],
    caveats: [
      ...unverifiedLiquid,
      "12 mg/ml es una referencia de archivo. El estante también ha ofrecido otros escalones.",
    ],
    tags: ["freebase", "tabaco", "10ml", "mtl"],
    status: "referenciado",
    flavorIds: ["tabaco.rubio"],
    recommendedDraw: ["MTL", "RDL"],
    variations: [
      {
        id: "tribeca-12",
        label: "12 mg/ml · 10 ml",
        format: "libre",
        volumeMl: 10,
        nicotineMg: 12,
        nicotineType: "freebase",
        ratio: "50/50",
        bottle: "10 ml listo para vapear",
        assumedBottleMl: 10,
        tpd: "si",
      },
    ],
  },
  ...bomboLiquids,
  ...drifterLiquids,
  ...herreraLiquids,
  ...kingsCrestLiquids,
  ...oxvaLiquids,
];

export const parts: Part[] = extraParts;

export function primaryVariation(liquid: Liquid): LiquidVariation | undefined {
  return liquid.variations[0];
}

export interface VariationRange {
  count: number;
  volumeMl: { min: number; max: number };
  nicotineMg: { min: number; max: number };
}

export function variationRange(liquid: Liquid): VariationRange | null {
  if (liquid.variations.length === 0) return null;
  const volumes = liquid.variations.map((variation) => variation.volumeMl);
  const strengths = liquid.variations.map((variation) => variation.nicotineMg);
  return {
    count: liquid.variations.length,
    volumeMl: { min: Math.min(...volumes), max: Math.max(...volumes) },
    nicotineMg: { min: Math.min(...strengths), max: Math.max(...strengths) },
  };
}

export function liquidTpd(liquid: Liquid): TpdStatus {
  const statuses = liquid.variations
    .map((variation) => variation.tpd)
    .filter((status): status is TpdStatus => status != null);
  if (statuses.length === 0) return "no-aplica";
  if (statuses.every((status) => status === statuses[0])) return statuses[0]!;
  return "parcial";
}

export function brandById(id: string): Brand | undefined {
  return brands.find((brand) => brand.id === id);
}

export function platformById(id: string): Platform | undefined {
  return platforms.find((platform) => platform.id === id);
}

export function taxonById(id: string): Taxon | undefined {
  return taxa.find((taxon) => taxon.id === id);
}

export function deviceBySlug(slug: string): Device | undefined {
  return devices.find((device) => device.slug === slug);
}

export function coilBySlug(slug: string): Coil | undefined {
  return coils.find((coil) => coil.slug === slug);
}

export function liquidBySlug(slug: string): Liquid | undefined {
  return liquids.find((liquid) => liquid.slug === slug);
}

export function partBySlug(slug: string): Part | undefined {
  return parts.find((part) => part.slug === slug);
}

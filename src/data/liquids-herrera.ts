import type { Liquid, LiquidVariation, SourceRef } from "./types.ts";

const PGVG: SourceRef = {
  label: "Herrera — PG y VG, 50 % / 50 % (consultado 2026-09-29)",
  url: "https://herreraeliquid.com/es/47-pg-y-vg",
};

const WEB: SourceRef = {
  label: "Herrera — web de marca, Concept Liquids (Nottingham) e ISO 9001 (consultado 2026-09-29)",
  url: "https://herreraeliquid.es/",
};

const SHOP: SourceRef = {
  label: "Herrera — tienda oficial, catálogo de sabores (consultado 2026-09-29)",
  url: "https://herreraeliquid.com/es/14-sabor",
};

const TPD_CAVEAT =
  "No se reproduce número de notificación TPD ni código UFI: no constan en las páginas oficiales consultadas.";
const RATIO_CAVEAT = "El 50/50 PG/VG procede de la página oficial «PG y VG» de la marca.";
const LONGFILL60_CAVEAT =
  "En el formato de 60 ml la web de marca y la ficha de categoría describen 40 ml de concentrado en envase de 60 ml; la pestaña de descripción de varios productos aún indica 5 ml de aroma concentrado + 30 ml de VG + 25 ml de PG. Se recoge la cifra de marca y se marca la discrepancia.";
const NO10_CAVEAT =
  "La marca no publica formato de 10 ml listo para vapear para este sabor; sólo longfill de 30, 60 y 120 ml.";

function libre10(flavorId: string, mg: number): LiquidVariation {
  return {
    id: `${flavorId}-10-libre-${mg}`,
    label: mg === 0 ? "10 ml · 0 mg/ml (sin nicotina)" : `10 ml · nicotina libre ${mg} mg/ml`,
    format: "libre",
    volumeMl: 10,
    nicotineMg: mg,
    nicotineType: mg === 0 ? "ninguna" : "freebase",
    ratio: "50/50",
    bottle: "10 ml listo para vapear",
    assumedBottleMl: 10,
    tpd: "si",
    composition: {
      vgPct: 50,
      pgPct: 50,
      note: "Ratio 50 % PG / 50 % VG según la página oficial PG y VG de la marca.",
    },
  };
}

function sales10(flavorId: string, mg: number): LiquidVariation {
  return {
    id: `${flavorId}-10-sales-${mg}`,
    label: `10 ml · sales de nicotina ${mg} mg/ml`,
    format: "sales",
    volumeMl: 10,
    nicotineMg: mg,
    nicotineType: "sal",
    ratio: "50/50",
    bottle: "10 ml listo para vapear",
    assumedBottleMl: 10,
    tpd: "si",
    composition: {
      vgPct: 50,
      pgPct: 50,
      note: "Ratio 50 % PG / 50 % VG según la página oficial PG y VG de la marca.",
    },
  };
}

function aroma30(flavorId: string, name: string): LiquidVariation {
  return {
    id: `${flavorId}-30`,
    label: `${name} · mini longfill 30 ml`,
    format: "aroma",
    volumeMl: 30,
    nicotineMg: 0,
    nicotineType: "ninguna",
    ratio: null,
    bottle: "Mini longfill 30 ml con 10 ml de aroma",
    assumedBottleMl: 30,
    tpd: "no-aplica",
    composition: {
      aromaPct: 33.3,
      note: "Botella de 30 ml con 10 ml de aroma concentrado en base 100 % PG. Para 30 ml listos hay que añadir 10 ml de VG y 10 ml de base 50/50 (botellas no incluidas).",
    },
  };
}

function aroma60(flavorId: string, name: string): LiquidVariation {
  return {
    id: `${flavorId}-60`,
    label: `${name} · longfill 60 ml`,
    format: "aroma",
    volumeMl: 60,
    nicotineMg: 0,
    nicotineType: "ninguna",
    ratio: null,
    bottle: "Envase de 60 ml",
    assumedBottleMl: 60,
    tpd: "no-aplica",
    composition: {
      note: "La marca describe 40 ml de concentrado en un envase de 60 ml, completado con una botella de PG y otra de VG de Herrera. La pestaña de producto de varios sabores aún indica 5 ml de aroma concentrado + 30 ml de VG + 25 ml de PG.",
    },
  };
}

function aroma120(flavorId: string, name: string): LiquidVariation {
  return {
    id: `${flavorId}-120`,
    label: `${name} · longfill 120 ml`,
    format: "aroma",
    volumeMl: 120,
    nicotineMg: 0,
    nicotineType: "ninguna",
    ratio: null,
    bottle: "Botella de 120 ml con 10 ml de aroma súper concentrado",
    assumedBottleMl: 120,
    tpd: "no-aplica",
    composition: {
      aromaPct: 8.3,
      note: "Botella de 120 ml con 10 ml de aroma súper concentrado en base 100 % PG. Añadir 110 ml de PG/VG; para un 50/50, 60 ml de VG y 50 ml de PG.",
    },
  };
}

function base10(flavorId: string): LiquidVariation[] {
  return [0, 3, 6, 12, 18].map((mg) => libre10(flavorId, mg));
}

function sal10(flavorId: string): LiquidVariation[] {
  return [6, 12, 20].map((mg) => sales10(flavorId, mg));
}

export const herreraLiquids: Liquid[] = [
  {
    domain: "liquid",
    id: "herrera-abarra",
    slug: "herrera-abarra",
    archiveId: "A510-LIQ-HER-ABARRA",
    brandId: "herrera",
    name: "Abarra",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Eliquid de extracto natural de tabaco derivado de la variedad criollo dominicano, cultivado en las plantaciones de Cuba. La marca lo describe como su tabaco más fuerte. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml, con una versión Reserva reposada cuatro semanas en barrica de roble francés.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Abarra 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/abarra/16-1235-abarra-10.html",
      },
      {
        label: "Herrera — Abarra 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/abarra/65-1257-abarra-10-sales.html",
      },
      {
        label: "Herrera — categoría Abarra (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/15-abarra",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, TPD_CAVEAT],
    tags: [
      "herrera",
      "tabaco",
      "net",
      "criollo",
      "mtl",
      "50-50",
      "10ml",
      "sales",
      "longfill",
      "reserva",
    ],
    status: "referenciado",
    flavorIds: ["tabaco.criollo"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-abarra"),
      ...sal10("herrera-abarra"),
      aroma30("herrera-abarra", "Abarra"),
      aroma60("herrera-abarra", "Abarra"),
      aroma120("herrera-abarra", "Abarra"),
      aroma30("herrera-abarra-reserva", "Abarra Reserva"),
      aroma60("herrera-abarra-reserva", "Abarra Reserva"),
      aroma120("herrera-abarra-reserva", "Abarra Reserva"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-viura",
    slug: "herrera-viura",
    archiveId: "A510-LIQ-HER-VIURA",
    brandId: "herrera",
    name: "Viura",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Extracto natural de tabaco cubano Corojo mezclado con Corojo cultivado en el valle de Jamastrán, en el sur de Honduras. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml, con una versión Reserva reposada cuatro semanas en barrica de roble francés.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Viura 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/viura/17-1263-viura-10.html",
      },
      {
        label: "Herrera — Viura 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/viura/66-1260-viura-10-sales.html",
      },
      {
        label: "Herrera — categoría Viura (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/16-viura",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, TPD_CAVEAT],
    tags: [
      "herrera",
      "tabaco",
      "net",
      "corojo",
      "mtl",
      "50-50",
      "10ml",
      "sales",
      "longfill",
      "reserva",
    ],
    status: "referenciado",
    flavorIds: ["tabaco.corojo"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-viura"),
      ...sal10("herrera-viura"),
      aroma30("herrera-viura", "Viura"),
      aroma60("herrera-viura", "Viura"),
      aroma120("herrera-viura", "Viura"),
      aroma30("herrera-viura-reserva", "Viura Reserva"),
      aroma60("herrera-viura-reserva", "Viura Reserva"),
      aroma120("herrera-viura-reserva", "Viura Reserva"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-boj",
    slug: "herrera-boj",
    archiveId: "A510-LIQ-HER-BOJ",
    brandId: "herrera",
    name: "Boj",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Extracto natural de tabaco North American Shade, cultivado bajo sombra en el valle del río Connecticut (EE. UU.) y usado como hoja de capa de cigarros de lujo. Premio al mejor eliquid de tabaco en la VapExpo de Barcelona 2017. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml, con una versión Reserva en barrica de roble francés.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Boj 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/boj/25-1252-boj-10.html",
      },
      {
        label: "Herrera — Boj 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/boj/67-1268-boj-10-sales.html",
      },
      {
        label: "Herrera — categoría Boj (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/25-boj",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [
      RATIO_CAVEAT,
      LONGFILL60_CAVEAT,
      "La taxonomía del catálogo no tiene sub-id para el tabaco North American Shade; se archiva bajo el taxón genérico de tabaco neto.",
      TPD_CAVEAT,
    ],
    tags: [
      "herrera",
      "tabaco",
      "net",
      "shade",
      "mtl",
      "50-50",
      "10ml",
      "sales",
      "longfill",
      "reserva",
      "premiado",
    ],
    status: "referenciado",
    flavorIds: ["tabaco.neto"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-boj"),
      ...sal10("herrera-boj"),
      aroma30("herrera-boj", "Boj"),
      aroma60("herrera-boj", "Boj"),
      aroma120("herrera-boj", "Boj"),
      aroma30("herrera-boj-reserva", "Boj Reserva"),
      aroma60("herrera-boj-reserva", "Boj Reserva"),
      aroma120("herrera-boj-reserva", "Boj Reserva"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-ultramenthol",
    slug: "herrera-ultramenthol",
    archiveId: "A510-LIQ-HER-ULTRAMENTHOL",
    brandId: "herrera",
    name: "Ultramenthol",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Menta ultrapotente, descrita por la marca como la que deja helado el pecho. No es un tabaco. Premio al mejor líquido de menta en la VapExpo 2023. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Ultramenthol 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/ultramenthol/18-1247-ultramenthol-10.html",
      },
      {
        label: "Herrera — Ultramenthol 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/ultramenthol/68-1271-ultramenthol-10-sales.html",
      },
      {
        label: "Herrera — categoría Ultramenthol (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/17-ultramenthol",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [
      RATIO_CAVEAT,
      LONGFILL60_CAVEAT,
      "La descripción del producto Ultramenthol 30 repite por error el texto de Abarra («10 ml de aroma concentrado Abarra»).",
      TPD_CAVEAT,
    ],
    tags: [
      "herrera",
      "menta",
      "mentolado",
      "mtl",
      "50-50",
      "10ml",
      "sales",
      "longfill",
      "premiado",
    ],
    status: "referenciado",
    flavorIds: ["menta.frio"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-ultramenthol"),
      ...sal10("herrera-ultramenthol"),
      aroma30("herrera-ultramenthol", "Ultramenthol"),
      aroma60("herrera-ultramenthol", "Ultramenthol"),
      aroma120("herrera-ultramenthol", "Ultramenthol"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-tolono",
    slug: "herrera-tolono",
    archiveId: "A510-LIQ-HER-TOLONO",
    brandId: "herrera",
    name: "Toloño",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Extracto natural de hojas de tabaco Virginia cultivadas en Georgia (EE. UU.) y curadas con fuego, con un sabor bajo en azúcar y ligeramente ahumado. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Toloño 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/tolono/60-285-toloño-10.html",
      },
      {
        label: "Herrera — Toloño 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/tolono/84-1279-toloño-10-sales.html",
      },
      {
        label: "Herrera — categoría Toloño (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/32-tolono",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, TPD_CAVEAT],
    tags: [
      "herrera",
      "tabaco",
      "net",
      "rubio",
      "virginia",
      "mtl",
      "50-50",
      "10ml",
      "sales",
      "longfill",
    ],
    status: "referenciado",
    flavorIds: ["tabaco.rubio"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-tolono"),
      ...sal10("herrera-tolono"),
      aroma30("herrera-tolono", "Toloño"),
      aroma60("herrera-tolono", "Toloño"),
      aroma120("herrera-tolono", "Toloño"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-churdinas",
    slug: "herrera-churdinas",
    archiveId: "A510-LIQ-HER-CHURDINAS",
    brandId: "herrera",
    name: "Churdinas",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Extracto natural de tabaco mapacho (Nicotiana rustica) de la selva peruana, descrito por la marca como muy potente. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Churdinas 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/churdinas/61-284-churdinas-10.html",
      },
      {
        label: "Herrera — Churdinas 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/churdinas/85-1282-churdinas-10-sales.html",
      },
      {
        label: "Herrera — categoría Churdinas (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/33-churdinas",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, TPD_CAVEAT],
    tags: ["herrera", "tabaco", "net", "mapacho", "mtl", "50-50", "10ml", "sales", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.neto"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-churdinas"),
      ...sal10("herrera-churdinas"),
      aroma30("herrera-churdinas", "Churdinas"),
      aroma60("herrera-churdinas", "Churdinas"),
      aroma120("herrera-churdinas", "Churdinas"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-penas",
    slug: "herrera-penas",
    archiveId: "A510-LIQ-HER-PENAS",
    brandId: "herrera",
    name: "Peñas",
    line: "Herrera",
    familyId: "freebase",
    subId: "freebase.10",
    summary:
      "Extracto natural de tabaco Dokha cultivado en Oriente Medio, principalmente en Irán, secado en el desierto y con un toque ligeramente picante y terroso. Se ofrece en 10 ml de nicotina libre y de sales, y en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — Peñas 10 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/penas/81-1274-peñas-10.html",
      },
      {
        label: "Herrera — Peñas 10 ml sales (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/penas/93-1285-peñas-10-sales.html",
      },
      {
        label: "Herrera — categoría Peñas (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/35-penas",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [
      RATIO_CAVEAT,
      LONGFILL60_CAVEAT,
      "La descripción oficial de Peñas 120 habla de una botella de 60 ml con 30 ml de aroma y de añadir 30 ml de VG; esas cifras no cuadran con el nombre 120 ni con el resto de longfill de 120 ml.",
      TPD_CAVEAT,
    ],
    tags: ["herrera", "tabaco", "net", "dokha", "mtl", "50-50", "10ml", "sales", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.neto"],
    recommendedDraw: ["MTL"],
    variations: [
      ...base10("herrera-penas"),
      ...sal10("herrera-penas"),
      aroma30("herrera-penas", "Peñas"),
      aroma60("herrera-penas", "Peñas"),
      aroma120("herrera-penas", "Peñas"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-puro-habano",
    slug: "herrera-puro-habano",
    archiveId: "A510-LIQ-HER-PUROHABANO",
    brandId: "herrera",
    name: "Puro Habano",
    line: "Herrera",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Extracto natural de tabaco de hoja de capa Habana fermentado, de plantas de semilla cubana, con fermentación en tres etapas. La marca lo describe como un sabor fuerte de envoltura de cigarro. Sólo se ofrece en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — categoría Puro Habano (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/36-puro-habano",
      },
      {
        label: "Herrera — Puro Habano 60 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/puro-habano/152-puro-habano-60.html",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [
      RATIO_CAVEAT,
      LONGFILL60_CAVEAT,
      NO10_CAVEAT,
      "La ficha de categoría describe el longfill de 60 ml como 40 ml de concentrado más una botella de PG y otra de VG de Herrera.",
      TPD_CAVEAT,
    ],
    tags: ["herrera", "tabaco", "net", "habano", "mtl", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.habano"],
    recommendedDraw: ["MTL"],
    variations: [
      aroma30("herrera-puro-habano", "Puro Habano"),
      aroma60("herrera-puro-habano", "Puro Habano"),
      aroma120("herrera-puro-habano", "Puro Habano"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-cigarrillo-habano",
    slug: "herrera-cigarrillo-habano",
    archiveId: "A510-LIQ-HER-CIGHABANO",
    brandId: "herrera",
    name: "Cigarrillo Habano",
    line: "Herrera",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Extracto natural de tabaco de hoja de capa Habano curado seis semanas, de plantas de semilla cubana. Comparte tabaco con Puro Habano, pero sólo se cura, sin fermentar, por lo que resulta más suave. Sólo se ofrece en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — categoría Cigarrillo Habano (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/37-cigarrillo-habano",
      },
      {
        label: "Herrera — Cigarro Habano 60 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/cigarrillo-habano/151-cigarro-habano-60.html",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [
      RATIO_CAVEAT,
      LONGFILL60_CAVEAT,
      NO10_CAVEAT,
      "La marca rotula este producto como «Cigarro Habano 60» en la ficha y como «Cigarrillo Habano 30/120» en el resto; se mantiene el nombre de la línea.",
      TPD_CAVEAT,
    ],
    tags: ["herrera", "tabaco", "net", "habano", "mtl", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.habano"],
    recommendedDraw: ["MTL"],
    variations: [
      aroma30("herrera-cigarrillo-habano", "Cigarrillo Habano"),
      aroma60("herrera-cigarrillo-habano", "Cigarrillo Habano"),
      aroma120("herrera-cigarrillo-habano", "Cigarrillo Habano"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-inglares",
    slug: "herrera-inglares",
    archiveId: "A510-LIQ-HER-INGLARES",
    brandId: "herrera",
    name: "Inglares",
    line: "Herrera",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Extracto natural de tabaco Latakia, mezcla de orientales Basma e Izmir curados lentamente con humo, con aroma ahumado y un toque de madera. Sólo se ofrece en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — categoría Inglares (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/39-inglares",
      },
      {
        label: "Herrera — Inglares 60 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/inglares/155-inglares-60.html",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, NO10_CAVEAT, TPD_CAVEAT],
    tags: ["herrera", "tabaco", "net", "latakia", "oriental", "mtl", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.neto"],
    recommendedDraw: ["MTL"],
    variations: [
      aroma30("herrera-inglares", "Inglares"),
      aroma60("herrera-inglares", "Inglares"),
      aroma120("herrera-inglares", "Inglares"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-roques",
    slug: "herrera-roques",
    archiveId: "A510-LIQ-HER-ROQUES",
    brandId: "herrera",
    name: "Roques",
    line: "Herrera",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Extracto natural de tabaco Cavendish, mezcla de Virginia y Burley prensada y vaporizada a fuego alto, con sabor cálido, dulce y aromático y un ligero aroma a vainilla. Sólo se ofrece en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — categoría Roques (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/40-roques",
      },
      {
        label: "Herrera — Roques 60 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/roques/156-roques-60.html",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, NO10_CAVEAT, TPD_CAVEAT],
    tags: ["herrera", "tabaco", "net", "cavendish", "virginia", "burley", "mtl", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.neto"],
    recommendedDraw: ["MTL"],
    variations: [
      aroma30("herrera-roques", "Roques"),
      aroma60("herrera-roques", "Roques"),
      aroma120("herrera-roques", "Roques"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-rivas",
    slug: "herrera-rivas",
    archiveId: "A510-LIQ-HER-RIVAS",
    brandId: "herrera",
    name: "Rivas",
    line: "Herrera",
    familyId: "shortfill",
    subId: "shortfill.50",
    summary:
      "Extracto natural de tabaco Perique con notas añadidas de caramelo y vainilla. El Perique obtiene su sabor de la fermentación en barrica. Sólo se ofrece en longfill de 30, 60 y 120 ml.",
    confidence: "fabricante",
    sources: [
      {
        label: "Herrera — categoría Rivas (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/41-rivas",
      },
      {
        label: "Herrera — Rivas 60 ml (consultado 2026-09-29)",
        url: "https://herreraeliquid.com/es/rivas/160-rivas-60.html",
      },
      PGVG,
      SHOP,
      WEB,
    ],
    caveats: [RATIO_CAVEAT, LONGFILL60_CAVEAT, NO10_CAVEAT, TPD_CAVEAT],
    tags: ["herrera", "tabaco", "net", "perique", "caramelo", "vainilla", "mtl", "longfill"],
    status: "referenciado",
    flavorIds: ["tabaco.neto"],
    recommendedDraw: ["MTL"],
    variations: [
      aroma30("herrera-rivas", "Rivas"),
      aroma60("herrera-rivas", "Rivas"),
      aroma120("herrera-rivas", "Rivas"),
    ],
  },
  {
    domain: "liquid",
    id: "herrera-chufli",
    slug: "herrera-chufli",
    archiveId: "A510-LIQ-HER-CHUFLI",
    brandId: "herrera",
    name: "Chufli",
    line: "Clásicos",
    familyId: "sal",
    subId: "sal.10",
    summary:
      "Clásico anisado de Herrera conservado como histórico. No aparece en el catálogo oficial consultado el 2026-09-29.",
    confidence: "fabricante",
    sources: [SHOP, WEB],
    caveats: [
      "No aparece en el catálogo oficial consultado el 2026-09-29. Se conserva como histórico, con el formato de sales de 10 ml del resto de la marca.",
      "SUPUESTO NO VERIFICADO como SKU vigente.",
      TPD_CAVEAT,
    ],
    tags: ["herrera", "historico", "clasico", "anisado", "sales", "10ml", "mtl"],
    status: "historico",
    flavorIds: ["complejo.anisado"],
    recommendedDraw: ["MTL"],
    variations: [sales10("herrera-chufli", 20)],
  },
  {
    domain: "liquid",
    id: "herrera-pechuga",
    slug: "herrera-pechuga",
    archiveId: "A510-LIQ-HER-PECHUGA",
    brandId: "herrera",
    name: "Pechuga",
    line: "Clásicos",
    familyId: "sal",
    subId: "sal.10",
    summary:
      "Clásico cremoso de Herrera conservado como histórico. No aparece en el catálogo oficial consultado el 2026-09-29.",
    confidence: "fabricante",
    sources: [SHOP, WEB],
    caveats: [
      "No aparece en el catálogo oficial consultado el 2026-09-29. Se conserva como histórico, con el formato de sales de 10 ml del resto de la marca.",
      "SUPUESTO NO VERIFICADO como SKU vigente.",
      TPD_CAVEAT,
    ],
    tags: ["herrera", "historico", "clasico", "crema", "sales", "10ml", "mtl"],
    status: "historico",
    flavorIds: ["postre.crema"],
    recommendedDraw: ["MTL"],
    variations: [sales10("herrera-pechuga", 20)],
  },
];

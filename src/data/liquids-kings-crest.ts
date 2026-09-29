import type { Liquid, LiquidVariation, SourceRef } from "./types.ts";

const COLLECTION_TITLES: Record<string, string> = {
  "kings-crest-fruits": "Fruits",
  "bali-fruits": "Bali Fruits",
  "bar-salts": "Bar Salts",
  "cream-team": "Cream Team",
  dessert: "Dessert",
  tobacco: "Tobacco",
};

const FREE_BASE_CAVEATS = [
  "Ficha levantada contra kingscrest.com el 2026-09-29 (solo fuente oficial).",
  "El fabricante publica en cada ficha el bloque de línea 70/30 VG/PG, 0–12 mg y tres tamaños (30, 60 y 120 ml). Las variaciones replican ese estándar publicado; el listado de la tienda detalla los 12 cruces tamaño/graduación en la colección Bali Fruits y un único SKU por defecto en el resto.",
  "No se publica número de notificación TPD ni código UFI; los formatos de hasta 120 ml con nicotina superan el tope TPD europeo de 10 ml.",
  "La descripción menciona en algunos sabores una versión «30 ml salt nic»; solo la línea Bar Salts detalla sales y es la que se modela como tal.",
];

const BAR_SALT_CAVEATS = [
  "Ficha levantada contra kingscrest.com el 2026-09-29 (solo fuente oficial).",
  "El fabricante publica para Bar Salts una mezcla 50/50 VG/PG y nicotina en sal de 25, 35 y 50 mg en bote de 30 ml.",
  "No se publica número de notificación TPD ni código UFI.",
];

const STUB_CAVEAT =
  "La ficha oficial no publica bloque de especificaciones (ni ratio, ni graduaciones, ni tamaños); se registra sin variaciones para no inventar datos.";

type KingsFlavor = {
  handle: string;
  name: string;
  line: string;
  collections: string[];
  flavorIds: string[];
  summary: string;
  tags?: string[];
  extraCaveats?: string[];
  stub?: boolean;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanLiquidName(name: string): string {
  return name.replace(/\s+Bar Salts$/i, "").trim();
}

function sourcesFor(flavor: KingsFlavor): SourceRef[] {
  const sources: SourceRef[] = [
    {
      label: `Kings Crest — ficha ${flavor.name} (consultado 2026-09-29)`,
      url: `https://kingscrest.com/products/${flavor.handle}`,
    },
  ];
  for (const collection of flavor.collections) {
    sources.push({
      label: `Kings Crest — colección ${COLLECTION_TITLES[collection] ?? collection} (consultado 2026-09-29)`,
      url: `https://kingscrest.com/collections/${collection}`,
    });
  }
  return sources;
}

const FREE_BASE_SIZES = [30, 60, 120] as const;
const FREE_BASE_MG = [0, 3, 6, 12] as const;

function freeBaseVariations(slug: string): LiquidVariation[] {
  const variations: LiquidVariation[] = [];
  for (const volumeMl of FREE_BASE_SIZES) {
    for (const nicotineMg of FREE_BASE_MG) {
      variations.push({
        id: `${slug}-${volumeMl}ml-${nicotineMg}mg`,
        label: `${volumeMl} ml · ${nicotineMg} mg`,
        volumeMl,
        hasNicotine: nicotineMg > 0,
        ...(nicotineMg > 0 ? { nicotineMg } : {}),
        ratio: "70/30",
        bottle: `${volumeMl} ml listo para vapear`,
        composition: {
          vgPct: 70,
          pgPct: 30,
          note: "Mezcla 70/30 VG/PG publicada en la ficha del fabricante.",
        },
      });
    }
  }
  return variations;
}

const BAR_SALT_MG = [25, 35, 50] as const;

function barSaltVariations(slug: string): LiquidVariation[] {
  return BAR_SALT_MG.map((nicotineMg) => ({
    id: `${slug}-30ml-${nicotineMg}mg`,
    label: `30 ml · ${nicotineMg} mg sal`,
    volumeMl: 30,
    hasNicotine: true,
    nicotineMg,
    ratio: "50/50",
    bottle: "30 ml listo para vapear",
    composition: {
      vgPct: 50,
      pgPct: 50,
      note: "Mezcla 50/50 VG/PG publicada en la ficha del fabricante.",
    },
  }));
}

function freeBaseLiquid(flavor: KingsFlavor): Liquid {
  const name = cleanLiquidName(flavor.name);
  const slug = `kings-crest-${slugify(name)}-freebase`;
  return {
    domain: "liquid",
    id: slug,
    slug,
    archiveId: `A510-LIQ-KCR-${flavor.handle.toUpperCase()}-FREEBASE`,
    brandId: "kings-crest",
    name,
    summary: flavor.summary,
    confidence: "fabricante",
    sources: sourcesFor(flavor),
    caveats: flavor.stub
      ? [...FREE_BASE_CAVEATS, ...(flavor.extraCaveats ?? []), STUB_CAVEAT]
      : [...FREE_BASE_CAVEATS, ...(flavor.extraCaveats ?? [])],
    tags: [
      "freebase",
      "70/30",
      "30ml",
      "60ml",
      "120ml",
      "0-12mg",
      "kings-crest",
      slugify(flavor.line),
      ...(flavor.tags ?? []),
    ],
    status: "referenciado",
    genreId: "freebase",
    line: flavor.line,
    flavorIds: flavor.flavorIds,
    draws: ["RDL", "DL"],
    variations: flavor.stub ? [] : freeBaseVariations(slug),
  };
}

function barSaltLiquid(flavor: KingsFlavor): Liquid {
  const name = cleanLiquidName(flavor.name);
  const slug = `kings-crest-${slugify(name)}-sales`;
  return {
    domain: "liquid",
    id: slug,
    slug,
    archiveId: `A510-LIQ-KCR-${flavor.handle.toUpperCase()}-SALES`,
    brandId: "kings-crest",
    name,
    summary: flavor.summary,
    confidence: "fabricante",
    sources: sourcesFor(flavor),
    caveats: [...BAR_SALT_CAVEATS, ...(flavor.extraCaveats ?? [])],
    tags: [
      "sales",
      "50/50",
      "30ml",
      "25-50mg",
      "kings-crest",
      "bar-salts",
      "mtl",
      ...(flavor.tags ?? []),
    ],
    status: "referenciado",
    genreId: "sales",
    line: flavor.line,
    flavorIds: flavor.flavorIds,
    draws: ["MTL", "RDL"],
    variations: barSaltVariations(slug),
  };
}

const freeBaseFlavors: KingsFlavor[] = [
  {
    handle: "mango-berry-ice",
    name: "Mango Berry Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.mango", "frutal.bayas", "menta.frio"],
    summary:
      "Freebase de la línea Fruits con mango dorado y bayas silvestres sobre acabado helado.",
    tags: ["ice", "mango", "bayas"],
  },
  {
    handle: "pineapple-pomegranate-ice",
    name: "Pineapple Pomegranate Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.pina", "frutal", "menta.frio"],
    summary:
      "Piña y granada con acabado helado; cruce de dulzor tropical y nota ácida de la línea Fruits.",
    tags: ["ice", "pina", "granada"],
  },
  {
    handle: "grape-ice",
    name: "Grape Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.uva", "menta.frio"],
    summary:
      "Uva Concord pura sin mezclas, con exhalación helada; perfil unitario de la línea Fruits.",
    tags: ["ice", "uva"],
  },
  {
    handle: "strawberry-peach-ice",
    name: "Strawberry Peach Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.fresa", "frutal.melocoton", "menta.frio"],
    summary: "Fresa madura y melocotón con acabado helado, dentro de la colección Fruits.",
    tags: ["ice", "fresa", "melocoton"],
  },
  {
    handle: "watermelon-lemonade-ice",
    name: "Watermelon Lemonade Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.sandia", "frutal.citricos", "menta.frio"],
    summary: "Sandía y limonada con acabado helado; perfil frutal-cítrico de la línea Fruits.",
    tags: ["ice", "sandia", "limonada"],
  },
  {
    handle: "peach-mango-ice",
    name: "Peach Mango Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.melocoton", "frutal.mango", "menta.frio"],
    summary: "Melocotón y mango de perfil tropical con acabado helado.",
    tags: ["ice", "melocoton", "mango"],
  },
  {
    handle: "lemon-lime-ice",
    name: "Lemon Lime Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.citricos", "menta.frio"],
    summary: "Limón y lima, pareja cítrica con exhalación helada.",
    tags: ["ice", "citricos"],
  },
  {
    handle: "banana-berry-ice",
    name: "Banana Berry Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.platano", "frutal.bayas", "menta.frio"],
    summary: "Plátano cremoso y bayas dulces con acabado helado.",
    tags: ["ice", "platano", "bayas"],
  },
  {
    handle: "blueberry-acai-ice",
    name: "Blueberry Acai Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.arandano", "frutal.bayas", "menta.frio"],
    summary: "Arándano dulce y açaí exótico con acabado helado.",
    tags: ["ice", "arandano", "acai"],
  },
  {
    handle: "spearmint-ice",
    name: "Spearmint Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["menta.frio"],
    summary: "Menta pura con máximo frío; el perfil más refrescante de la línea Fruits.",
    tags: ["ice", "menta"],
  },
  {
    handle: "grape-apple-ice",
    name: "Grape Apple Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.uva", "frutal.manzana", "menta.frio"],
    summary: "Uva y manzana, dos frutas con acabado helado.",
    tags: ["ice", "uva", "manzana"],
  },
  {
    handle: "mixed-berry-ice",
    name: "Mixed Berry Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.bayas", "menta.frio"],
    summary: "Mezcla de bayas maduras con acabado helado.",
    tags: ["ice", "bayas"],
  },
  {
    handle: "blue-raspberry-ice",
    name: "Blue Raspberry Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.frambuesa", "menta.frio"],
    summary: "Frambuesa azul de perfil goloso y golpe helado inconfundible.",
    tags: ["ice", "frambuesa"],
  },
  {
    handle: "strawberry-kiwi-ice",
    name: "Strawberry Kiwi Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.fresa", "frutal.kiwi", "menta.frio"],
    summary: "Fresa y kiwi, pareja clásica con acabado helado.",
    tags: ["ice", "fresa", "kiwi"],
  },
  {
    handle: "mango-pina-colada-ice",
    name: "Mango Pina Colada Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.mango", "frutal.pina", "frutal.coco", "menta.frio"],
    summary: "Mango, piña y coco: escape tropical con exhalación helada.",
    tags: ["ice", "mango", "pina", "coco"],
  },
  {
    handle: "pineapple-apricot-lychee-ice",
    name: "Pineapple Apricot Lychee Ice",
    line: "Fruits",
    collections: ["kings-crest-fruits"],
    flavorIds: ["frutal.pina", "frutal.lychee", "frutal", "menta.frio"],
    summary: "Piña, albaricoque y lichi; la mezcla frutal más compleja de la línea Fruits.",
    tags: ["ice", "pina", "albaricoque", "lichi"],
  },
  {
    handle: "pear-mango-guava",
    name: "Pear Mango Guava",
    line: "Bali Fruits",
    collections: ["bali-fruits"],
    flavorIds: ["frutal.pera", "frutal.mango", "frutal.guayaba"],
    summary: "Trío tropical de pera, mango y guayaba de la colección Bali Fruits.",
    tags: ["pera", "mango", "guayaba"],
  },
  {
    handle: "pear-mango-guava-ice",
    name: "Pear Mango Guava Ice",
    line: "Bali Fruits",
    collections: ["bali-fruits"],
    flavorIds: ["frutal.pera", "frutal.mango", "frutal.guayaba", "menta.frio"],
    summary: "Versión helada del trío de pera, mango y guayaba.",
    tags: ["ice", "pera", "mango", "guayaba"],
  },
  {
    handle: "watermelon-kiwi-strawberry",
    name: "Watermelon Kiwi Strawberry",
    line: "Bali Fruits",
    collections: ["bali-fruits", "kings-crest-fruits"],
    flavorIds: ["frutal.sandia", "frutal.kiwi", "frutal.fresa"],
    summary: "Trío tropical de sandía, kiwi y fresa de la colección Bali Fruits.",
    tags: ["sandia", "kiwi", "fresa"],
  },
  {
    handle: "watermelon-kiwi-strawberry-ice",
    name: "Watermelon Kiwi Strawberry Ice",
    line: "Bali Fruits",
    collections: ["bali-fruits"],
    flavorIds: ["frutal.sandia", "frutal.kiwi", "frutal.fresa", "menta.frio"],
    summary: "Versión helada del trío de sandía, kiwi y fresa.",
    tags: ["ice", "sandia", "kiwi", "fresa"],
  },
  {
    handle: "buttercream",
    name: "Buttercream",
    line: "Cream Team",
    collections: ["cream-team"],
    flavorIds: ["postre.crema", "postre.helado"],
    summary:
      "Helado de vainilla, crema de mantequilla y bizcocho; postre de la colección Cream Team.",
    tags: ["postre", "crema"],
  },
  {
    handle: "cinnaroll",
    name: "Cinnaroll",
    line: "Cream Team",
    collections: ["cream-team"],
    flavorIds: ["postre", "postre.helado", "especias.canela"],
    summary: "Bollo de canela con glaseado de vainilla y remolino de helado.",
    tags: ["postre", "canela"],
  },
  {
    handle: "neapolitan",
    name: "Neapolitan",
    line: "Cream Team",
    collections: ["cream-team"],
    flavorIds: ["postre.helado", "postre.chocolate", "frutal.fresa"],
    summary: "Helado clásico en capas de vainilla, fresa y chocolate.",
    tags: ["postre", "helado"],
  },
  {
    handle: "blueberry-duchess",
    name: "Blueberry Duchess",
    line: "Duchess",
    collections: ["dessert"],
    flavorIds: ["postre.crema", "frutal.arandano"],
    summary: "Arándano sobre base de tres leches con nube de malvavisco.",
    tags: ["postre", "arandano"],
  },
  {
    handle: "strawberry-duchess",
    name: "Strawberry Duchess",
    line: "Duchess",
    collections: ["dessert"],
    flavorIds: ["postre.crema", "postre.tarta", "frutal.fresa"],
    summary: "Fresa, tarta de crema y malvavisco; versión afrutada de la tarta Duchess.",
    tags: ["postre", "fresa"],
  },
  {
    handle: "duchess-reserve",
    name: "Duchess Reserve",
    line: "Duchess",
    collections: ["dessert"],
    flavorIds: ["postre.crema", "postre.tarta", "golosina.caramelo"],
    summary: "Tres leches con malvavisco y caramelo de mantequilla.",
    tags: ["postre", "tres-leches"],
  },
  {
    handle: "don-juan-custard",
    name: "Don Juan Custard",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["postre.crema", "frutos-secos", "golosina.caramelo"],
    summary: "Nuez de mantequilla, crema pastelera rica y caramelo dorado.",
    tags: ["postre", "custard"],
  },
  {
    handle: "don-juan-cafe",
    name: "Don Juan Cafe",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["bebida.cafe", "postre.chocolate", "postre.crema"],
    summary: "Espresso, chocolate y crema; momento mochaccino de la línea Don Juan.",
    tags: ["postre", "cafe"],
  },
  {
    handle: "don-juan-churro",
    name: "Don Juan Churro",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["postre", "postre.chocolate", "especias.canela"],
    summary: "Azúcar y canela con baño de chocolate, recreación del churro recién frito.",
    tags: ["postre", "churro"],
  },
  {
    handle: "don-juan-peanut",
    name: "Don Juan Peanut",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["postre.crema", "frutos-secos", "postre.chocolate"],
    summary: "Mantequilla de cacahuete, chocolate, nuez y crema sobre la base Don Juan.",
    tags: ["postre", "cacahuete"],
  },
  {
    handle: "don-juan-tabaco-honey",
    name: "Don Juan Tabaco Honey",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["tabaco.rubio", "postre.miel", "frutos-secos", "postre"],
    summary: "Tarta de nuez, tabaco rubio y calidez de miel floral.",
    tags: ["tabaco", "miel"],
  },
  {
    handle: "don-juan-tabaco-dulce",
    name: "Don Juan Tabaco Dulce",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["tabaco", "postre.chocolate", "postre.crema"],
    summary: "Tabaco dulce con chocolate y crema láctea de acabado aterciopelado.",
    tags: ["tabaco", "chocolate"],
  },
  {
    handle: "don-juan-supra",
    name: "Don Juan Supra",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["tabaco", "postre.chocolate", "postre.tarta", "frutos-secos"],
    summary:
      "Colaboración con Bombo: tarta de chocolate, mantequilla de nuez y tabaco caramelizado.",
    tags: ["tabaco", "chocolate"],
  },
  {
    handle: "don-juan-reserve",
    name: "Don Juan Reserve",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["postre.tarta", "postre.helado", "frutos-secos"],
    summary:
      "Buque insignia de la marca: tarta de nuez, helado de vainilla, azúcar moreno y hojaldre.",
    tags: ["postre", "reserve"],
  },
  {
    handle: "don-juan-reserve-ultra",
    name: "Don Juan Aldonza",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["postre", "postre.chocolate"],
    summary:
      "Perfil de chocolate; ficha oficial servida bajo el handle don-juan-reserve-ultra con el título Don Juan Aldonza.",
    tags: ["postre", "chocolate"],
    extraCaveats: [
      "El título oficial del producto («Don Juan Aldonza») no coincide con su handle de URL («don-juan-reserve-ultra»). Se conservan ambos tal cual.",
    ],
  },
  {
    handle: "don-juan-reserve-ultra-1",
    name: "Don Juan Reserve Ultra",
    line: "Don Juan",
    collections: ["dessert"],
    flavorIds: ["postre"],
    summary:
      "Producto oficial de la línea Don Juan cuya ficha no publica especificaciones de ratio, graduación ni tamaño.",
    tags: ["postre"],
    stub: true,
    extraCaveats: [
      "El título oficial («Don Juan Reserve Ultra») no coincide con su handle de URL («don-juan-reserve-ultra-1»). Se conservan ambos tal cual.",
    ],
  },
  {
    handle: "american-tobacco",
    name: "American Tobacco",
    line: "Tobacco",
    collections: ["tobacco"],
    flavorIds: ["tabaco.rubio"],
    summary: "Hoja tostada, cuerpo suave y dulzor natural; tabaco americano directo.",
    tags: ["tabaco", "rubio"],
  },
  {
    handle: "dominican-tobacco",
    name: "Dominican Tobacco",
    line: "Tobacco",
    collections: ["tobacco"],
    flavorIds: ["tabaco.criollo"],
    summary: "Hoja dominicana del valle del Cibao con calidez terrosa y fondo de cacao.",
    tags: ["tabaco", "cacao"],
  },
  {
    handle: "cuban-tobacco",
    name: "Cuban Tobacco",
    line: "Tobacco",
    collections: ["tobacco"],
    flavorIds: ["tabaco.habano"],
    summary: "Hoja cubana terrosa, humo rotundo y especia sutil; inspirado en La Habana.",
    tags: ["tabaco", "habano"],
  },
  {
    handle: "tobacco-ice",
    name: "Tobacco Ice",
    line: "Tobacco",
    collections: ["tobacco"],
    flavorIds: ["tabaco", "menta.frio"],
    summary: "Tabaco rico, crema de vainilla y menta helada.",
    tags: ["tabaco", "menta"],
  },
  {
    handle: "tobacco-sweet",
    name: "Tobacco Sweet",
    line: "Tobacco",
    collections: ["tobacco"],
    flavorIds: ["tabaco", "postre"],
    summary: "Tabaco suave, crema de vainilla y calidez dorada.",
    tags: ["tabaco", "postre"],
  },
  {
    handle: "tobacco-dry",
    name: "Tobacco Dry",
    line: "Tobacco",
    collections: ["tobacco"],
    flavorIds: ["tabaco"],
    summary: "Tabaco rotundo, crema de vainilla y aire seco y elegante.",
    tags: ["tabaco", "seco"],
  },
];

const barSaltFlavors: KingsFlavor[] = [
  {
    handle: "watermelon-ice-bar-salts",
    name: "Watermelon Ice Bar Salts",
    line: "Bar Salts",
    collections: ["bar-salts"],
    flavorIds: ["frutal.sandia", "menta.frio"],
    summary: "Sales de sandía golosa y escarchada de la línea Bar Salts, pensada para pods.",
    tags: ["ice", "sandia"],
  },
  {
    handle: "peach-ice-bar-salts",
    name: "Peach Ice Bar Salts",
    line: "Bar Salts",
    collections: ["bar-salts"],
    flavorIds: ["frutal.melocoton", "menta.frio"],
    summary: "Sales de melocotón jugoso con frío ártico, de la línea Bar Salts.",
    tags: ["ice", "melocoton"],
  },
  {
    handle: "mango-ice-bar-salts",
    name: "Mango Ice Bar Salts",
    line: "Bar Salts",
    collections: ["bar-salts"],
    flavorIds: ["frutal.mango", "menta.frio"],
    summary: "Sales de mango tropical con brisa fría, de la línea Bar Salts.",
    tags: ["ice", "mango"],
  },
  {
    handle: "cherry-ice-bar-salts",
    name: "Cherry Ice Bar Salts",
    line: "Bar Salts",
    collections: ["bar-salts"],
    flavorIds: ["frutal.cereza", "menta.frio"],
    summary: "Sales de cereza oscura y néctar con mentol, de la línea Bar Salts.",
    tags: ["ice", "cereza"],
  },
  {
    handle: "blueberry-ice-bar-salts",
    name: "Blueberry Ice Bar Salts",
    line: "Bar Salts",
    collections: ["bar-salts"],
    flavorIds: ["frutal.arandano", "menta.frio"],
    summary: "Sales de arándano profundo con mentol, de la línea Bar Salts.",
    tags: ["ice", "arandano"],
  },
];

export const kingsCrestLiquids: Liquid[] = [
  ...freeBaseFlavors.map(freeBaseLiquid),
  ...barSaltFlavors.map(barSaltLiquid),
];

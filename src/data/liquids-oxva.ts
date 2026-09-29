import type { Liquid, LiquidVariation, SourceRef } from "./types.ts";

const flavorPage = "https://oxpassion.com/pages/flavor";
const flavorData =
  "https://www.oxpassion.com/cdn/shop/t/2/assets/flavor.js?v=37336787584077936801782869061";
const ukNewFlavours =
  "https://oxpassion.com/blogs/news/ox-passion-uk-new-flavours-6-fresh-tastes-to-elevate-your-everyday-vape";
const ukFlavourReview =
  "https://oxpassion.com/blogs/news/ox-passion-uk-flavour-review-10-irresistible-vape-flavours-you-ll-love";
const ecigclickReview =
  "https://oxpassion.com/blogs/news/ecigclick-review-ox-passion-uk-e-liquids-deliver-authentic-fruity-excellence";

const baseSources: SourceRef[] = [
  {
    label: "OX PASSION — catálogo EU de sabores (consultado 2026-09-29)",
    url: flavorPage,
  },
  {
    label: "OX PASSION — datos de sabores de la página oficial (consultado 2026-09-29)",
    url: flavorData,
  },
];

const newFlavourSource: SourceRef = {
  label: "OX PASSION — seis sabores nuevos UK (consultado 2026-09-29)",
  url: ukNewFlavours,
};

const reviewSource: SourceRef = {
  label: "OX PASSION — reseña de 10 sabores UK (consultado 2026-09-29)",
  url: ukFlavourReview,
};

const ecigclickSource: SourceRef = {
  label: "OX PASSION — reseña Ecigclick (consultado 2026-09-29)",
  url: ecigclickReview,
};

const strengthsByMarket: Record<string, number[]> = {
  UK: [5, 10, 20],
  España: [10, 15, 20],
  Polonia: [20],
  Chequia: [10, 20],
};

const marketTag: Record<string, string> = {
  UK: "uk",
  España: "espana",
  Polonia: "polonia",
  Chequia: "chequia",
};

const noUfi =
  "SUPUESTO NO VERIFICADO: la web oficial no reproduce UFI ni número de notificación TPD.";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function oxvaVariation(slug: string, mg: number): LiquidVariation {
  const variation: LiquidVariation = {
    id: `${slug}-${mg}`,
    label: `10 ml · ${mg} mg/ml`,
    volumeMl: 10,
    hasNicotine: mg > 0,
    ratio: "50/50",
    bottle: "10 ml listo para vapear",
    assumedBottleMl: 10,
    tpd: "si",
  };
  if (mg > 0) {
    variation.nicotineMg = mg;
  }
  return variation;
}

function oxvaFlavor(input: {
  name: string;
  flavorIds: string[];
  markets: string[];
  strengths: number[];
  extraSources?: SourceRef[];
}): Liquid {
  const key = slugify(input.name);
  const slug = `oxva-${key}-sales`;
  const marketStrengths = input.markets
    .map((market) => `${market} ${strengthsByMarket[market].join("/")} mg/ml`)
    .join("; ");
  const marketLabels = input.markets.join(", ");
  return {
    domain: "liquid",
    id: slug,
    slug,
    archiveId: `A510-LIQ-OXV-${key.replace(/-/g, "").toUpperCase()}-SALES`,
    brandId: "oxva",
    name: input.name,
    line: "OX Passion",
    summary: `Sales OX PASSION de ${input.name}. Línea de sales de nicotina 50/50 en bote de 10 ml, formulada por OXVA para pods XLIM y calada MTL. Publicada en la EU VERSION (${marketLabels}).`,
    confidence: "fabricante",
    sources: [...baseSources, ...(input.extraSources ?? [])],
    caveats: [
      noUfi,
      "El fabricante no publica el desglose VG/PG, el porcentaje de aromas ni la lista de ingredientes; la web oficial no permite rellenar `composition`.",
      "oxpassion.com organiza la línea en versiones EU, ME y SEA con listados y graduaciones distintos. Esta ficha archiva la EU VERSION.",
      `Mercados EU que listan este sabor y graduaciones publicadas: ${marketStrengths}. La ficha reúne la unión de graduaciones del sabor por mercado; no afirma que todas existan en cada país.`,
      "La web oficial no publica una versión de 0 mg de esta línea de sales; el rango EU publicado es 5–20 mg/ml.",
    ],
    tags: ["sales", "10ml", "oxva", "50/50", ...input.markets.map((market) => marketTag[market])],
    status: "referenciado",
    genreId: "sales",
    flavorIds: input.flavorIds,
    draws: ["MTL"],
    variations: input.strengths.map((mg) => oxvaVariation(slug, mg)),
  };
}

export const oxvaLiquids: Liquid[] = [
  oxvaFlavor({
    name: "Dragon Fruit",
    flavorIds: ["frutal.tropicales"],
    markets: ["UK"],
    strengths: [5, 10, 20],
    extraSources: [newFlavourSource],
  }),
  oxvaFlavor({
    name: "Menthol",
    flavorIds: ["menta", "menta.frio"],
    markets: ["UK"],
    strengths: [5, 10, 20],
    extraSources: [newFlavourSource],
  }),
  oxvaFlavor({
    name: "Strawberry Coconut",
    flavorIds: ["frutal.fresa", "frutal.coco"],
    markets: ["UK"],
    strengths: [5, 10, 20],
    extraSources: [newFlavourSource],
  }),
  oxvaFlavor({
    name: "Lychee Ice",
    flavorIds: ["frutal.lychee", "menta.frio"],
    markets: ["UK"],
    strengths: [5, 10, 20],
    extraSources: [newFlavourSource],
  }),
  oxvaFlavor({
    name: "Fruity Gum",
    flavorIds: ["golosina.chicle", "frutal"],
    markets: ["UK"],
    strengths: [5, 10, 20],
    extraSources: [newFlavourSource],
  }),
  oxvaFlavor({
    name: "Cherry BBG",
    flavorIds: ["frutal.cereza", "golosina.chicle"],
    markets: ["UK"],
    strengths: [5, 10, 20],
    extraSources: [newFlavourSource],
  }),
  oxvaFlavor({
    name: "Blue Razz Gummy",
    flavorIds: ["frutal.frambuesa", "golosina"],
    markets: ["UK"],
    strengths: [5, 10, 20],
  }),
  oxvaFlavor({
    name: "Blue Mist",
    flavorIds: ["frutal.arandano", "menta.frio"],
    markets: ["UK"],
    strengths: [5, 10, 20],
  }),
  oxvaFlavor({
    name: "Pina Daiquiri",
    flavorIds: ["frutal.pina", "complejo"],
    markets: ["UK"],
    strengths: [5, 10, 20],
  }),
  oxvaFlavor({
    name: "Blue Bubble",
    flavorIds: ["frutal.arandano", "golosina.chicle"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Melon Berries",
    flavorIds: ["frutal.sandia", "frutal.bayas"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Strawberry Raspberry Mojito",
    flavorIds: ["frutal.fresa", "frutal.frambuesa", "bebida.mojito"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Strawberry Vanilla Ice Cream",
    flavorIds: ["frutal.fresa", "postre.helado"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Blackcurrant Rebena",
    flavorIds: ["frutal.arandano"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Melon Banana",
    flavorIds: ["frutal.sandia", "frutal.platano"],
    markets: ["UK", "España", "Chequia"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Pink Lemon Bubbly",
    flavorIds: ["frutal.citricos", "bebida.refresco"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Pink Guava",
    flavorIds: ["frutal.guayaba"],
    markets: ["UK", "España", "Chequia"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Pina Colada",
    flavorIds: ["frutal.pina", "frutal.coco"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Citrus Mango Guava",
    flavorIds: ["frutal.citricos", "frutal.mango", "frutal.guayaba"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
    extraSources: [reviewSource],
  }),
  oxvaFlavor({
    name: "Strawberry Raspberry Cherry",
    flavorIds: ["frutal.fresa", "frutal.frambuesa", "frutal.cereza"],
    markets: ["UK", "España", "Polonia", "Chequia"],
    strengths: [5, 10, 15, 20],
    extraSources: [ecigclickSource],
  }),
  oxvaFlavor({
    name: "Mixed Grapes",
    flavorIds: ["frutal.uva"],
    markets: ["UK", "España", "Polonia", "Chequia"],
    strengths: [5, 10, 15, 20],
  }),
  oxvaFlavor({
    name: "Blue Sour Razz",
    flavorIds: ["frutal.frambuesa"],
    markets: ["UK", "España", "Polonia", "Chequia"],
    strengths: [5, 10, 15, 20],
    extraSources: [ecigclickSource],
  }),
  oxvaFlavor({
    name: "Strawberry Melon",
    flavorIds: ["frutal.fresa", "frutal.sandia"],
    markets: ["UK", "España"],
    strengths: [5, 10, 15, 20],
  }),
  oxvaFlavor({
    name: "Pineapple Freeze",
    flavorIds: ["frutal.pina", "menta.frio"],
    markets: ["UK", "España", "Chequia"],
    strengths: [5, 10, 15, 20],
  }),
  oxvaFlavor({
    name: "Lemon Lime",
    flavorIds: ["frutal.citricos"],
    markets: ["UK", "España", "Chequia"],
    strengths: [5, 10, 15, 20],
  }),
  oxvaFlavor({
    name: "Cherry Fizz",
    flavorIds: ["frutal.cereza", "bebida.refresco"],
    markets: ["UK", "España", "Polonia", "Chequia"],
    strengths: [5, 10, 15, 20],
    extraSources: [ecigclickSource],
  }),
  oxvaFlavor({
    name: "Triple Mango",
    flavorIds: ["frutal.mango"],
    markets: ["UK", "España", "Chequia"],
    strengths: [5, 10, 15, 20],
  }),
  oxvaFlavor({
    name: "Mint Mix",
    flavorIds: ["menta", "menta.frio"],
    markets: ["UK", "Polonia"],
    strengths: [5, 10, 20],
  }),
  oxvaFlavor({
    name: "Cherry Peach Lemon",
    flavorIds: ["frutal.cereza", "frutal.melocoton", "frutal.citricos"],
    markets: ["UK", "España", "Polonia", "Chequia"],
    strengths: [5, 10, 20],
    extraSources: [ecigclickSource],
  }),
  oxvaFlavor({
    name: "Blue Citrus",
    flavorIds: ["frutal.arandano", "frutal.citricos"],
    markets: ["UK", "Polonia", "Chequia"],
    strengths: [5, 10, 20],
    extraSources: [ecigclickSource],
  }),
  oxvaFlavor({
    name: "Berries Burst",
    flavorIds: ["frutal.bayas"],
    markets: ["UK", "Polonia", "Chequia"],
    strengths: [5, 10, 20],
  }),
  oxvaFlavor({
    name: "Senorita",
    flavorIds: ["frutal.tropicales", "complejo"],
    markets: ["España", "Polonia"],
    strengths: [10, 15, 20],
  }),
  oxvaFlavor({
    name: "Paradise Punch",
    flavorIds: ["frutal.tropicales", "frutal.citricos"],
    markets: ["España"],
    strengths: [10, 15, 20],
  }),
  oxvaFlavor({
    name: "Sour Trio Berries",
    flavorIds: ["frutal.bayas", "complejo"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Straw Razz Ice Tea",
    flavorIds: ["frutal.fresa", "frutal.frambuesa", "bebida.ice-tea"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Aloe Watermelon",
    flavorIds: ["frutal.sandia", "menta.frio"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Cherry Rasp Ice Tea",
    flavorIds: ["frutal.cereza", "frutal.frambuesa", "bebida.ice-tea"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Lemon Mint Mojito",
    flavorIds: ["frutal.citricos", "bebida.mojito", "menta.frio"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Sour Grape Pom Razz",
    flavorIds: ["frutal.uva", "frutal.frambuesa", "complejo"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Lychee Ice Tea",
    flavorIds: ["frutal.lychee", "bebida.ice-tea", "menta.frio"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Blueberry Candy",
    flavorIds: ["frutal.arandano", "golosina.caramelo"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Peach Mojito",
    flavorIds: ["frutal.melocoton", "bebida.mojito", "menta.frio"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Lychee Raspberry",
    flavorIds: ["frutal.lychee", "frutal.frambuesa"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Strawberry Ice Cream",
    flavorIds: ["frutal.fresa", "postre.helado"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Kiwi Passion Fruit Guava",
    flavorIds: ["frutal.kiwi", "frutal.guayaba", "frutal.tropicales"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Peach",
    flavorIds: ["frutal.melocoton"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Mojito",
    flavorIds: ["bebida.mojito", "frutal.citricos", "menta.frio"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Strawberry Kiwi",
    flavorIds: ["frutal.fresa", "frutal.kiwi"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Apple Peach",
    flavorIds: ["frutal.manzana", "frutal.melocoton"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Watermelon",
    flavorIds: ["frutal.sandia"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Ox Fizz",
    flavorIds: ["complejo", "bebida.refresco"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Cola",
    flavorIds: ["bebida.refresco"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Strawberry",
    flavorIds: ["frutal.fresa"],
    markets: ["Polonia"],
    strengths: [20],
  }),
  oxvaFlavor({
    name: "Pineapple Coconut",
    flavorIds: ["frutal.pina", "frutal.coco"],
    markets: ["Chequia"],
    strengths: [10, 20],
  }),
  oxvaFlavor({
    name: "Sweet Blueberry",
    flavorIds: ["frutal.arandano"],
    markets: ["Chequia"],
    strengths: [10, 20],
  }),
  oxvaFlavor({
    name: "Blackcurrant Squash",
    flavorIds: ["frutal.arandano"],
    markets: ["Chequia"],
    strengths: [10, 20],
  }),
];

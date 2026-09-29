import { catalogImageManifest } from "./images.gen";

/**
 * Fotos de producto: slug de la ficha → ruta del original. Los originales viven
 * en assets/catalog (fuera del bundle público); aquí solo se conserva su ruta
 * para derivar la clave del manifiesto de variantes.
 */
const catalogImages: Record<string, string> = {
  "geekvape-aegis-legend-2": "/catalog/geekvape-aegis-legend-2.jpg",
  "geekvape-b-0-15": "/catalog/geekvape-b-0-15.png",
  "geekvape-b-0-2": "/catalog/geekvape-b-0-2.jpg",
  "geekvape-b-0-3": "/catalog/geekvape-b-0-3.jpg",
  "geekvape-b-0-4": "/catalog/geekvape-b-0-4.jpg",
  "geekvape-b-0-6": "/catalog/geekvape-b-0-6.png",
  "geekvape-b-0-8": "/catalog/geekvape-b-0-8.png",
  "geekvape-b-1-2": "/catalog/geekvape-b-1-2.jpg",
  "geekvape-g-0-6": "/catalog/geekvape-g-0-6.jpg",
  "geekvape-g-0-8": "/catalog/geekvape-g-0-8.png",
  "geekvape-g-1-0": "/catalog/geekvape-g-1-0.png",
  "geekvape-g-1-2-m": "/catalog/geekvape-g-1-2-m.jpg",
  "geekvape-g-1-2-s": "/catalog/geekvape-g-1-2-s.png",
  "geekvape-g-1-2": "/catalog/geekvape-g-1-2.jpg",
  "geekvape-g-1-8": "/catalog/geekvape-g-1-8.png",
  "geekvape-m-0-14": "/catalog/geekvape-m-0-14.png",
  "geekvape-m-0-15": "/catalog/geekvape-m-0-15.png",
  "geekvape-m-0-2": "/catalog/geekvape-m-0-2.png",
  "geekvape-m-0-3": "/catalog/geekvape-m-0-3.png",
  "geekvape-p-0-15": "/catalog/geekvape-p-0-15.jpg",
  "geekvape-p-0-2": "/catalog/geekvape-p-0-2.png",
  "geekvape-p-0-4": "/catalog/geekvape-p-0-4.png",
  "geekvape-p-0-5": "/catalog/geekvape-p-0-5.png",
  "geekvape-q-0-4": "/catalog/geekvape-q-0-4.png",
  "geekvape-q-0-6": "/catalog/geekvape-q-0-6.png",
  "geekvape-q-0-8": "/catalog/geekvape-q-0-8.png",
  "geekvape-q-1-2": "/catalog/geekvape-q-1-2.png",
  "geekvape-u-0-7": "/catalog/geekvape-u-0-7.jpg",
  "geekvape-u-1-1": "/catalog/geekvape-u-1-1.jpg",
  "geekvape-u-pod": "/catalog/geekvape-u-pod.jpg",
  "geekvape-z-0-15-xm": "/catalog/geekvape-z-0-15-xm.png",
  "geekvape-z-0-15": "/catalog/geekvape-z-0-15.png",
  "geekvape-z-0-2": "/catalog/geekvape-z-0-2.jpg",
  "geekvape-z-0-25": "/catalog/geekvape-z-0-25.png",
  "geekvape-z-0-4-xm": "/catalog/geekvape-z-0-4-xm.png",
  "geekvape-z-0-4": "/catalog/geekvape-z-0-4.jpg",
  "oxva-xlim-go-2": "/catalog/oxva-xlim-go-2.png",
  "oxva-xlim-pro-2": "/catalog/oxva-xlim-pro-2.png",
  "oxva-xlim-sq-pro-2": "/catalog/oxva-xlim-sq-pro-2.png",
  "vaporesso-gt-ccell-0-3": "/catalog/vaporesso-gt-ccell-0-3.png",
  "vaporesso-gt-ccell-0-5": "/catalog/vaporesso-gt-ccell-0-5.png",
  "vaporesso-gt-mesh-0-18": "/catalog/vaporesso-gt-mesh-0-18.png",
  "vaporesso-gt2-0-4": "/catalog/vaporesso-gt2-0-4.png",
  "vaporesso-gt4-0-15": "/catalog/vaporesso-gt4-0-15.png",
  "vaporesso-gt6-0-2": "/catalog/vaporesso-gt6-0-2.png",
  "vaporesso-gt8-0-15": "/catalog/vaporesso-gt8-0-15.png",
  "vaporesso-gti-0-15": "/catalog/vaporesso-gti-0-15.png",
  "vaporesso-gti-0-2-dual": "/catalog/vaporesso-gti-0-2-dual.png",
  "vaporesso-gti-0-2": "/catalog/vaporesso-gti-0-2.png",
  "vaporesso-gti-0-4-dual": "/catalog/vaporesso-gti-0-4-dual.png",
  "vaporesso-gti-0-4": "/catalog/vaporesso-gti-0-4.png",
  "vaporesso-gti-0-5": "/catalog/vaporesso-gti-0-5.png",
  "vaporesso-gtr-0-15": "/catalog/vaporesso-gtr-0-15.png",
  "vaporesso-gtr-0-4": "/catalog/vaporesso-gtr-0-4.png",
  "vaporesso-gtx-0-15-dual": "/catalog/vaporesso-gtx-0-15-dual.png",
  "vaporesso-gtx-0-15": "/catalog/vaporesso-gtx-0-15.png",
  "vaporesso-gtx-0-2-dual": "/catalog/vaporesso-gtx-0-2-dual.png",
  "vaporesso-gtx-0-2": "/catalog/vaporesso-gtx-0-2.png",
  "vaporesso-gtx-0-3-dual": "/catalog/vaporesso-gtx-0-3-dual.png",
  "vaporesso-gtx-0-3": "/catalog/vaporesso-gtx-0-3.png",
  "vaporesso-gtx-0-4": "/catalog/vaporesso-gtx-0-4.png",
  "vaporesso-gtx-0-6": "/catalog/vaporesso-gtx-0-6.png",
  "vaporesso-gtx-0-8": "/catalog/vaporesso-gtx-0-8.png",
  "vaporesso-gtx-1-2": "/catalog/vaporesso-gtx-1-2.png",
  "vaporesso-luxe-x": "/catalog/vaporesso-luxe-x.png",
  "vaporesso-xros-4": "/catalog/vaporesso-xros-4.png",
  "voopoo-drag-x": "/catalog/voopoo-drag-x.png",
  "voopoo-pnp-dw60": "/catalog/voopoo-pnp-dw60.png",
  "voopoo-pnp-dw80": "/catalog/voopoo-pnp-dw80.png",
  "voopoo-pnp-m2": "/catalog/voopoo-pnp-m2.png",
  "voopoo-pnp-r1": "/catalog/voopoo-pnp-r1.png",
  "voopoo-pnp-r2": "/catalog/voopoo-pnp-r2.png",
  "voopoo-pnp-tm1": "/catalog/voopoo-pnp-tm1.png",
  "voopoo-pnp-tm2": "/catalog/voopoo-pnp-tm2.png",
  "voopoo-pnp-tr1": "/catalog/voopoo-pnp-tr1.png",
  "voopoo-pnp-tw15": "/catalog/voopoo-pnp-tw15.png",
  "voopoo-pnp-tw20": "/catalog/voopoo-pnp-tw20.png",
  "voopoo-pnp-tw30": "/catalog/voopoo-pnp-tw30.png",
  "voopoo-pnp-vm1": "/catalog/voopoo-pnp-vm1.png",
  "voopoo-pnp-vm2": "/catalog/voopoo-pnp-vm2.png",
  "voopoo-pnp-vm3": "/catalog/voopoo-pnp-vm3.png",
  "voopoo-pnp-vm4": "/catalog/voopoo-pnp-vm4.png",
  "voopoo-pnp-vm5": "/catalog/voopoo-pnp-vm5.png",
  "voopoo-pnp-vm6": "/catalog/voopoo-pnp-vm6.png",
  "xlim-0-4": "/catalog/xlim-0-4.png",
  "xlim-0-6": "/catalog/xlim-0-6.png",
  "xlim-0-8": "/catalog/xlim-0-8.png",
  "xlim-1-2": "/catalog/xlim-1-2.png",
  "xros-corex-0-4": "/catalog/xros-corex-0-4.png",
  "xros-corex-0-6": "/catalog/xros-corex-0-6.png",
  "xros-corex-0-7": "/catalog/xros-corex-0-7.png",
  "xros-corex-0-8": "/catalog/xros-corex-0-8.png",
  "xros-corex-1-0": "/catalog/xros-corex-1-0.png",
  "xros-corex-1-2": "/catalog/xros-corex-1-2.png",
  "bombo-bj-apple-peach-max-sales": "/catalog/bombo-bj-apple-peach-max-sales.png",
  "bombo-bj-blueberry-cherry-sales": "/catalog/bombo-bj-blueberry-cherry-sales.png",
  "bombo-bj-cola-strawberry-ice-cream-sales":
    "/catalog/bombo-bj-cola-strawberry-ice-cream-sales.png",
  "bombo-bj-cranberry-cherry-sales": "/catalog/bombo-bj-cranberry-cherry-sales.png",
  "bombo-bj-super-blackcurrant-sales": "/catalog/bombo-bj-super-blackcurrant-sales.png",
  "bombo-bj-twisty-fruity-sales": "/catalog/bombo-bj-twisty-fruity-sales.png",
  "bombo-pt-cookie-supra-reserve-sales": "/catalog/bombo-pt-cookie-supra-reserve-sales.png",
  "bombo-pt-culmen-sales": "/catalog/bombo-pt-culmen-sales.png",
  "bombo-pt-nutty-supra-reserve-sales": "/catalog/bombo-pt-nutty-supra-reserve-sales.png",
  "bombo-pt-pompeii-sales": "/catalog/bombo-pt-pompeii-sales.png",
  "bombo-pt-supra-aldonza-sales": "/catalog/bombo-pt-supra-aldonza-sales.png",
  "bombo-pt-supra-reserve-sales": "/catalog/bombo-pt-supra-reserve-sales.png",
  "bombo-solo-blue-sales": "/catalog/bombo-solo-blue-sales.png",
  "bombo-solo-lime-soda-sales": "/catalog/bombo-solo-lime-soda-sales.png",
  "bombo-solo-mango-ice-sales": "/catalog/bombo-solo-mango-ice-sales.png",
  "bombo-solo-menthol-ice-sales": "/catalog/bombo-solo-menthol-ice-sales.png",
  "bombo-solo-strawberry-cream-sales": "/catalog/bombo-solo-strawberry-cream-sales.png",
  "bombo-solo-sweet-tobacco-sales": "/catalog/bombo-solo-sweet-tobacco-sales.png",
  "bombo-solo-watermelon-sales": "/catalog/bombo-solo-watermelon-sales.png",
  "bombo-tr-tabaco-rubio-almendrado-sales": "/catalog/bombo-tr-tabaco-rubio-almendrado-sales.png",
  "bombo-tr-tabaco-rubio-creme-sales": "/catalog/bombo-tr-tabaco-rubio-creme-sales.png",
  "bombo-tr-tabaco-rubio-virginia-sales": "/catalog/bombo-tr-tabaco-rubio-virginia-sales.png",
  "bombo-wj-banana-ice-sales": "/catalog/bombo-wj-banana-ice-sales.png",
  "bombo-wj-blueberry-and-raspberry-sales": "/catalog/bombo-wj-blueberry-and-raspberry-sales.png",
  "bombo-wj-melon-and-watermelon-sales": "/catalog/bombo-wj-melon-and-watermelon-sales.png",
  "bombo-wj-melon-lime-and-coco-sales": "/catalog/bombo-wj-melon-lime-and-coco-sales.png",
  "bombo-wj-peach-and-mango-sales": "/catalog/bombo-wj-peach-and-mango-sales.png",
  "bombo-wj-pina-colada-ice-sales": "/catalog/bombo-wj-pina-colada-ice-sales.png",
  "bombo-wj-pina-colada-sales": "/catalog/bombo-wj-pina-colada-sales.png",
  "bombo-wj-pink-berries-sales": "/catalog/bombo-wj-pink-berries-sales.png",
  "bombo-wj-strawberry-and-pear-sales": "/catalog/bombo-wj-strawberry-and-pear-sales.png",
  "bombo-wj-strawberry-mojito-sales": "/catalog/bombo-wj-strawberry-mojito-sales.png",
  "bombo-wj-sweet-melon-ice-sales": "/catalog/bombo-wj-sweet-melon-ice-sales.png",
  "bombo-wj-watermelon-mojito-sales": "/catalog/bombo-wj-watermelon-mojito-sales.png",
  "drifter-apple-peach-sales": "/catalog/drifter-apple-peach-sales.jpg",
  "drifter-blue-razz-lemonade-ice-sales": "/catalog/drifter-blue-razz-lemonade-ice-sales.jpg",
  "drifter-cherry-sales": "/catalog/drifter-cherry-sales.jpg",
  "drifter-cotton-candy-ice-sales": "/catalog/drifter-cotton-candy-ice-sales.jpg",
  "drifter-kiwi-passionfruit-guava-sales": "/catalog/drifter-kiwi-passionfruit-guava-sales.jpg",
  "drifter-mad-blue-sales": "/catalog/drifter-mad-blue-sales.jpg",
  "drifter-mango-ice-sales": "/catalog/drifter-mango-ice-sales.jpg",
  "drifter-peach-ice-sales": "/catalog/drifter-peach-ice-sales.jpg",
  "drifter-pineapple-peach-mango-sales": "/catalog/drifter-pineapple-peach-mango-sales.jpg",
  "drifter-pink-lemonade-sales": "/catalog/drifter-pink-lemonade-sales.jpg",
  "drifter-strawberry-banana-ice-sales": "/catalog/drifter-strawberry-banana-ice-sales.jpg",
  "drifter-sweet-blueberry-ice-sales": "/catalog/drifter-sweet-blueberry-ice-sales.jpg",
  "drifter-sweet-strawberry-ice-sales": "/catalog/drifter-sweet-strawberry-ice-sales.jpg",
  "drifter-watermelon-ice-sales": "/catalog/drifter-watermelon-ice-sales.jpg",
  "geekvape-aegis-hero-5": "/catalog/geekvape-aegis-hero-5.png",
  "geekvape-aegis-nano-3": "/catalog/geekvape-aegis-nano-3.jpg",
  "geekvape-digi-q-vista": "/catalog/geekvape-digi-q-vista.png",
  "geekvape-go": "/catalog/geekvape-go.png",
  "geekvape-soul-2": "/catalog/geekvape-soul-2.png",
  "geekvape-wenax-q2": "/catalog/geekvape-wenax-q2.png",
  "herrera-abarra-sales": "/catalog/herrera-abarra-sales.png",
  "herrera-boj-sales": "/catalog/herrera-boj-sales.png",
  "herrera-churdinas-sales": "/catalog/herrera-churdinas-sales.png",
  "herrera-penas-sales": "/catalog/herrera-penas-sales.png",
  "herrera-tolono-sales": "/catalog/herrera-tolono-sales.png",
  "herrera-ultramenthol-sales": "/catalog/herrera-ultramenthol-sales.png",
  "herrera-viura-sales": "/catalog/herrera-viura-sales.png",
  "kings-crest-blueberry-ice-sales": "/catalog/kings-crest-blueberry-ice-sales.jpg",
  "kings-crest-cherry-ice-sales": "/catalog/kings-crest-cherry-ice-sales.jpg",
  "kings-crest-mango-ice-sales": "/catalog/kings-crest-mango-ice-sales.jpg",
  "kings-crest-peach-ice-sales": "/catalog/kings-crest-peach-ice-sales.jpg",
  "kings-crest-watermelon-ice-sales": "/catalog/kings-crest-watermelon-ice-sales.jpg",
  "oxva-nexlim-2": "/catalog/oxva-nexlim-2.png",
  "oxva-nexlim-go": "/catalog/oxva-nexlim-go.png",
  "oxva-xlim-3-ultra": "/catalog/oxva-xlim-3-ultra.png",
  "oxva-xlim-go-lite": "/catalog/oxva-xlim-go-lite.png",
  "oxva-xlim-pro-3": "/catalog/oxva-xlim-pro-3.png",
  "vaporesso-armour-g": "/catalog/vaporesso-armour-g.jpg",
  "vaporesso-armour-octa": "/catalog/vaporesso-armour-octa.png",
  "vaporesso-luxe-x3": "/catalog/vaporesso-luxe-x3.png",
  "vaporesso-luxe-xr-max-2": "/catalog/vaporesso-luxe-xr-max-2.png",
  "vaporesso-prix": "/catalog/vaporesso-prix.png",
  "vaporesso-xros-5": "/catalog/vaporesso-xros-5.png",
  "vaporesso-xros-6": "/catalog/vaporesso-xros-6.png",
  "voopoo-argus-g4": "/catalog/voopoo-argus-g4.png",
  "voopoo-argus-z3": "/catalog/voopoo-argus-z3.png",
  "voopoo-drag-6": "/catalog/voopoo-drag-6.png",
  "voopoo-vmate-max2": "/catalog/voopoo-vmate-max2.png",
  "voopoo-vrizz-2": "/catalog/voopoo-vrizz-2.png",
};

export interface CatalogImageVariant {
  width: number;
  src: string;
  bytes: number;
}

export interface CatalogImage {
  width: number;
  height: number;
  variants: CatalogImageVariant[];
  original: string;
}

export function productImage(slug: string): CatalogImage | undefined {
  const original = catalogImages[slug];
  if (!original) return undefined;
  const file = original.slice(original.lastIndexOf("/") + 1);
  const entry = catalogImageManifest[file];
  if (!entry) return undefined;
  return {
    width: entry.width,
    height: entry.height,
    variants: entry.variants,
    original,
  };
}

export function productImageSource(slug: string): string | undefined {
  const image = productImage(slug);
  if (!image) return undefined;
  const webp = image.variants.filter((variant) => variant.src.endsWith(".webp"));
  const pool = webp.length > 0 ? webp : image.variants;
  return pool.reduce<CatalogImageVariant | undefined>(
    (best, variant) => (!best || variant.width > best.width ? variant : best),
    undefined,
  )?.src;
}

export function catalogImage(slug: string): string | undefined {
  return productImageSource(slug);
}

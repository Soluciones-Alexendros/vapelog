/** Versión del contrato de tipos y reglas de dominio (semántica del modelo). */
export const SCHEMA_VERSION = "1.4.0" as const;

/** Revisión del contenido del catálogo en archivos (datos, no contrato). */
export const CATALOG_REVISION = "2026-10-17.entidades-fisicas" as const;

export type Domain = "device" | "coil" | "liquid" | "part";

export type Confidence = "fabricante" | "ficha" | "distribuidor";

export type TpdStatus = "si" | "parcial" | "no" | "no-aplica";

export type Draw = "MTL" | "RDL" | "DL";

export interface SourceRef {
  label: string;
  url: string;
}

export interface Taxon {
  id: string;
  domain: Domain | "flavor";
  parentId: string | null;
  es: string;
  en: string;
}

export interface Brand {
  id: string;
  name: string;
  country: string;
}

export interface Platform {
  id: string;
  name: string;
}

export interface Genre {
  id: string;
  es: string;
  en: string;
}

interface ItemBase {
  id: string;
  slug: string;
  archiveId: string;
  brandId: string;
  name: string;
  familyId?: string;
  subId?: string;
  summary: string;
  confidence: Confidence;
  sources: SourceRef[];
  caveats: string[];
  tags: string[];
  status: "referenciado" | "historico";
}

export interface Device extends ItemBase {
  domain: "device";
  batteryKind: "integrada" | "externa";
  batteryMah: number | null;
  cellCount: number | null;
  cellType: "18650" | "21700" | null;
  chargePort: "USB-C" | "Micro-USB" | null;
  chargeAmps: number | null;
  chargeVolts: number | null;
  capacityMl: number | null;
  capacityTpdMl: number | null;
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  weightG: number | null;
  displayKind: "TFT" | "Táctil" | "HD" | "LED" | "RGB" | null;
  displaySizeIn: number | null;
  powerMinW: number | null;
  powerMaxW: number | null;
  ohmMin: number | null;
  ohmMax: number | null;
  chipset: string | null;
  modes: string[];
  connector: "510" | "propietario";
  platformIds: string[];
  kitPlatformIds: string[];
  materials: string | null;
  airflow: string | null;
  tpd: TpdStatus;
  year: number | null;
  draws: Draw[];
}

export interface Coil extends ItemBase {
  domain: "coil";
  platformIds: string[];
  ohms: number;
  wattMin: number | null;
  wattMax: number | null;
  wireKind: "malla" | "doble-malla" | "alambre" | null;
  wireMaterial: string | null;
  build: "malla" | "doble-malla" | "capsula" | null;
  draws: Draw[];
  connector: "510" | "propietario";
  refillable: boolean;
  packCount: number | null;
  tpd?: TpdStatus;
}

/** Etiqueta derivada VG/PG; no se almacena como fuente de verdad. */
export type Ratio = `${number}/${number}`;

export interface LiquidComposition {
  /** Porcentajes del producto vendido (no de la receta final). */
  vgPct?: number;
  pgPct?: number;
  aromaPct?: number;
  nicotinePct?: number;
  ingredients?: string[];
  note?: string;
}

export interface LiquidRecipe {
  /** Proporciones de la mezcla final documentada. */
  vgPct?: number;
  pgPct?: number;
  aromaMl?: number;
  baseMl?: number;
  note?: string;
}

export interface LiquidVariation {
  id: string;
  label: string;
  /** Volumen de contenido del producto (ml). */
  fillVolumeMl: number;
  /** Capacidad del envase (ml). */
  containerCapacityMl: number;
  /** Volumen preparado; solo si la receta está publicada. */
  preparedVolumeMl?: number;
  /**
   * Concentración mg/ml: `0` cero conocido, `>0` positivo conocido,
   * `null` desconocido (nunca se interpreta como cero).
   */
  nicotineMgPerMl: number | null;
  /** Porcentaje VG del ratio publicado; `null` si no hay dato. */
  ratioVgPct: number | null;
  /** Porcentaje PG del ratio publicado; `null` si no hay dato. */
  ratioPgPct: number | null;
  bottle?: string;
  tpd?: TpdStatus;
  composition?: LiquidComposition;
  recipe?: LiquidRecipe;
  /** Discrepancias documentadas entre fuentes (p. ej. Herrera 60 ml). */
  conflictNotes?: string[];
  /** Diferencia estructurada de línea (p. ej. `reserva`). */
  lineVariant?: string;
}

export interface Liquid extends ItemBase {
  domain: "liquid";
  genreId: string;
  line: string;
  flavorIds: string[];
  draws: Draw[];
  variations: LiquidVariation[];
}

export type CatalogItem = Device | Coil | Liquid | Part;

export interface Part extends ItemBase {
  domain: "part";
  fitsPlatformIds: string[];
  fitsBattery: "18650" | null;
  fitsConnector: "510" | null;
  spec: string;
  quantityNote: string;
  dripMm?: number | null;
  chemistry?: string | null;
  continuousAmps?: number | null;
}

export type CompatKind = "nativa" | "kit" | "electrica" | "no";

export interface CompatResult {
  kind: CompatKind;
  reasons: string[];
}

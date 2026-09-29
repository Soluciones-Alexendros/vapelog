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

interface ItemBase {
  id: string;
  slug: string;
  archiveId: string;
  brandId: string;
  name: string;
  familyId: string;
  subId: string;
  summary: string;
  confidence: Confidence;
  sources: SourceRef[];
  caveats: string[];
  tags: string[];
  status: "referenciado" | "historico";
}

export interface Device extends ItemBase {
  domain: "device";
  format: string;
  battery: string;
  charge: string;
  power: string;
  powerMinW: number | null;
  powerMaxW: number | null;
  ohmMin: number | null;
  ohmMax: number | null;
  chipset: string | null;
  modes: string[];
  display: string | null;
  connector: "510" | "propietario";
  platformIds: string[];
  kitPlatformIds: string[];
  materials: string;
  airflow: string;
  capacity: string | null;
  dimensions: string | null;
  weight: string | null;
  tpd: TpdStatus;
  year: number | null;
  draw: string;
}

export interface Coil extends ItemBase {
  domain: "coil";
  platformIds: string[];
  ohms: number;
  wattMin: number | null;
  wattMax: number | null;
  wattConfidence: Confidence | null;
  wire: string;
  build: string;
  draw: Draw;
  connector: "510" | "propietario";
  refillable: boolean;
  pack: string;
}

export type NicotineType = "freebase" | "sal" | "ninguna";

export type LiquidFormat = "libre" | "sales" | "aroma" | "shortfill";

export type Ratio = `${number}/${number}`;

export interface LiquidComposition {
  vgPct?: number;
  pgPct?: number;
  aromaPct?: number;
  nicotinePct?: number;
  ingredients?: string[];
  note?: string;
}

export interface LiquidVariation {
  id: string;
  label: string;
  format: LiquidFormat;
  volumeMl: number;
  nicotineMg: number;
  nicotineType: NicotineType;
  ratio: Ratio | null;
  bottle?: string;
  assumedBottleMl?: number;
  tpd?: TpdStatus;
  composition?: LiquidComposition;
}

export interface Liquid extends ItemBase {
  domain: "liquid";
  line: string;
  flavorIds: string[];
  recommendedDraw: Draw[];
  variations: LiquidVariation[];
}

export type CatalogItem = Device | Coil | Liquid | Part;

export type PartKind = "bateria" | "boquilla";

export interface Part extends ItemBase {
  domain: "part";
  kind: PartKind;
  fitsPlatformIds: string[];
  fitsBattery: "18650" | null;
  fitsConnector: "510" | null;
  spec: string;
  quantityNote: string;
}

export type CompatKind = "nativa" | "kit" | "electrica" | "no";

export interface CompatResult {
  kind: CompatKind;
  reasons: string[];
}

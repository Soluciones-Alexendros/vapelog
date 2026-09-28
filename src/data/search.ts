import {
  brandById,
  devices,
  coils,
  liquids,
  parts,
  platformById,
  taxa,
  taxonById,
} from "./catalog.ts";
import { normalize } from "./logic.ts";
import { batteryKind, ohmBandId, ohmBands, powerBandId, powerBands, wireKind } from "./measures.ts";
import type { CatalogItem, Domain, Draw, Liquid } from "./types.ts";
import { EMPTY, relationRows, specFacts } from "./specs.ts";

export type OhmBand = "baja" | "media" | "alta" | "muy";
export type PowerBand = "baja" | "media" | "alta";
export type BatteryKind = "integrada" | "externa";
export type WireKind = "malla" | "alambre" | "ceramica";

export interface CatalogSearch {
  q?: string;
  familia?: string;
  sub?: string;
  marca?: string;
  vista?: "grid" | "lista" | "tabla";
  tpd?: "si";
  calada?: Draw;
  ohm?: OhmBand;
  conector?: "510" | "propietario";
  hilo?: WireKind;
  plataforma?: string;
  bateria?: BatteryKind;
  potencia?: PowerBand;
  nicotina?: Liquid["nicotineType"];
  ratio?: "50/50" | "70/30";
  orden?: "nombre" | "marca" | "ohm" | "vatios";
}

const OHM: OhmBand[] = ["baja", "media", "alta", "muy"];
const POWER: PowerBand[] = ["baja", "media", "alta"];
const DRAW: Draw[] = ["MTL", "RDL", "DL"];

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function parseCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const next: CatalogSearch = {};
  if (typeof search.q === "string" && search.q.trim()) next.q = search.q;
  if (typeof search.familia === "string" && search.familia) next.familia = search.familia;
  if (typeof search.sub === "string" && search.sub) next.sub = search.sub;
  if (typeof search.marca === "string" && search.marca) next.marca = search.marca;
  const vista = oneOf(search.vista, ["grid", "lista", "tabla"] as const);
  if (vista) next.vista = vista;
  if (search.tpd === "si") next.tpd = "si";
  const calada = oneOf(search.calada, DRAW);
  if (calada) next.calada = calada;
  const ohm = oneOf(search.ohm, OHM);
  if (ohm) next.ohm = ohm;
  const conector = oneOf(search.conector, ["510", "propietario"] as const);
  if (conector) next.conector = conector;
  const hilo = oneOf(search.hilo, ["malla", "alambre", "ceramica"] as const);
  if (hilo) next.hilo = hilo;
  if (typeof search.plataforma === "string" && search.plataforma)
    next.plataforma = search.plataforma;
  const bateria = oneOf(search.bateria, ["integrada", "externa"] as const);
  if (bateria) next.bateria = bateria;
  const potencia = oneOf(search.potencia, POWER);
  if (potencia) next.potencia = potencia;
  const nicotina = oneOf(search.nicotina, ["freebase", "sal", "ninguna"] as const);
  if (nicotina) next.nicotina = nicotina;
  const ratio = oneOf(search.ratio, ["50/50", "70/30"] as const);
  if (ratio) next.ratio = ratio;
  const orden = oneOf(search.orden, ["nombre", "marca", "ohm", "vatios"] as const);
  if (orden) next.orden = orden;
  return next;
}

export function itemsFor(domain: Domain): CatalogItem[] {
  if (domain === "device") return devices;
  if (domain === "coil") return coils;
  if (domain === "part") return parts;
  return liquids;
}

export function hasDraw(text: string, draw: Draw): boolean {
  const tokens = text.toUpperCase().match(/MTL|RDL|DL/g);
  if (!tokens) return false;
  return tokens.some((token) => token === draw);
}

function platformIds(item: CatalogItem): string[] {
  if (item.domain === "device") return [...item.platformIds, ...item.kitPlatformIds];
  if (item.domain === "coil") return item.platformIds;
  if (item.domain === "part") return item.fitsPlatformIds;
  return [];
}

function itemTpd(item: CatalogItem) {
  if (item.domain === "coil" || item.domain === "part") return "no-aplica" as const;
  return item.tpd;
}

function blob(item: CatalogItem): string {
  const brand = brandById(item.brandId)?.name ?? "";
  const family = taxonById(item.familyId)?.es ?? "";
  const sub = taxonById(item.subId)?.es ?? "";
  const specs =
    item.domain === "coil"
      ? `${item.ohms} ${item.wire} ${item.build} ${item.draw}`
      : item.domain === "device"
        ? `${item.power} ${item.battery} ${item.draw} ${item.connector}`
        : item.domain === "liquid"
          ? `${item.nicotineType} ${item.ratio ?? ""} ${item.volumeMl}`
          : item.spec;
  return normalize(
    [item.name, brand, family, sub, item.summary, item.tags.join(" "), item.archiveId, specs].join(
      " ",
    ),
  );
}

export function matches(
  item: CatalogItem,
  search: CatalogSearch,
  except?: keyof CatalogSearch,
): boolean {
  const on = (key: keyof CatalogSearch) => except !== key;
  if (on("familia") && search.familia && item.familyId !== search.familia) return false;
  if (on("sub") && search.sub && item.subId !== search.sub) return false;
  if (on("marca") && search.marca && item.brandId !== search.marca) return false;
  if (on("tpd") && search.tpd === "si" && itemTpd(item) !== "si") return false;
  if (on("calada") && search.calada) {
    const draw = search.calada;
    const ok =
      item.domain === "coil"
        ? item.draw === draw
        : item.domain === "device"
          ? hasDraw(item.draw, draw)
          : item.domain === "liquid"
            ? item.recommendedDraw.includes(draw)
            : false;
    if (!ok) return false;
  }
  if (on("ohm") && search.ohm) {
    if (item.domain !== "coil" || ohmBandId(item.ohms) !== search.ohm) return false;
  }
  if (on("hilo") && search.hilo) {
    if (item.domain !== "coil") return false;
    const kind = wireKind(item.wire, item.build);
    if (search.hilo === "malla" && kind !== "malla") return false;
    if (search.hilo === "alambre" && kind !== "alambre") return false;
    if (search.hilo === "ceramica" && kind !== "ceramica") return false;
  }
  if (on("conector") && search.conector) {
    const ok =
      item.domain === "device" || item.domain === "coil"
        ? item.connector === search.conector
        : item.domain === "part"
          ? search.conector === "510" && item.fitsConnector === "510"
          : false;
    if (!ok) return false;
  }
  if (on("plataforma") && search.plataforma && !platformIds(item).includes(search.plataforma))
    return false;
  if (on("bateria") && search.bateria) {
    if (item.domain !== "device" || batteryKind(item.battery) !== search.bateria) return false;
  }
  if (on("potencia") && search.potencia) {
    if (
      item.domain !== "device" ||
      item.powerMaxW == null ||
      powerBandId(item.powerMaxW) !== search.potencia
    )
      return false;
  }
  if (on("nicotina") && search.nicotina) {
    if (item.domain !== "liquid" || item.nicotineType !== search.nicotina) return false;
  }
  if (on("ratio") && search.ratio) {
    if (item.domain !== "liquid" || item.ratio !== search.ratio) return false;
  }
  if (on("q") && search.q && !blob(item).includes(normalize(search.q))) return false;
  return true;
}

function wattSort(item: CatalogItem): number {
  if (item.domain === "coil") return item.wattMax ?? 9999;
  if (item.domain === "device") return item.powerMaxW ?? 9999;
  return 9999;
}

export function query(domain: Domain, search: CatalogSearch): CatalogItem[] {
  const items = itemsFor(domain).filter((item) => matches(item, search));
  const orden = search.orden ?? "nombre";
  return items.sort((a, b) => {
    if (orden === "marca") {
      const byBrand = (brandById(a.brandId)?.name ?? "").localeCompare(
        brandById(b.brandId)?.name ?? "",
        "es",
      );
      if (byBrand !== 0) return byBrand;
    }
    if (orden === "ohm" && a.domain === "coil" && b.domain === "coil" && a.ohms !== b.ohms)
      return a.ohms - b.ohms;
    if (orden === "vatios") {
      const gap = wattSort(a) - wattSort(b);
      if (gap !== 0) return gap;
    }
    return a.name.localeCompare(b.name, "es");
  });
}

export interface FacetOption {
  id: string;
  label: string;
  count: number;
}

export interface Facet {
  key: keyof CatalogSearch;
  legend: string;
  control: "list" | "select";
  options: FacetOption[];
}

function countOptions(
  domain: Domain,
  search: CatalogSearch,
  key: keyof CatalogSearch,
  seeds: { id: string; label: string }[],
): FacetOption[] {
  return seeds
    .map((seed) => ({
      ...seed,
      count: itemsFor(domain).filter((item) => {
        const probe: CatalogSearch = { ...search, [key]: seed.id };
        if (key === "familia") delete probe.sub;
        return matches(item, probe);
      }).length,
    }))
    .filter((option) => option.count > 0 || search[key] === option.id);
}

function fixed(
  domain: Domain,
  search: CatalogSearch,
  key: keyof CatalogSearch,
  legend: string,
  seeds: { id: string; label: string }[],
  control: "list" | "select" = "list",
): Facet | null {
  const options = countOptions(domain, search, key, seeds);
  if (options.length === 0) return null;
  return { key, legend, control, options };
}

export function buildFacets(domain: Domain, search: CatalogSearch): Facet[] {
  const pool = itemsFor(domain);
  const families = taxa
    .filter((taxon) => taxon.domain === domain && taxon.parentId === null)
    .map((taxon) => ({ id: taxon.id, label: taxon.es }));
  const subs = taxa
    .filter(
      (taxon) =>
        taxon.domain === domain &&
        taxon.parentId !== null &&
        (!search.familia || taxon.parentId === search.familia),
    )
    .map((taxon) => ({ id: taxon.id, label: taxon.es }));
  const brands = [...new Set(pool.map((item) => item.brandId))].map((id) => ({
    id,
    label: brandById(id)?.name ?? id,
  }));
  const platforms = [...new Set(pool.flatMap((item) => platformIds(item)))].map((id) => ({
    id,
    label: platformById(id)?.name ?? id,
  }));

  const facets: Array<Facet | null> = [
    fixed(domain, search, "familia", domain === "coil" ? "Montaje" : "Formato", families),
    fixed(domain, search, "sub", domain === "coil" ? "Serie" : "Variante", subs),
    fixed(domain, search, "marca", "Marca", brands, "select"),
  ];

  if (domain === "coil" || domain === "device" || domain === "liquid") {
    facets.push(
      fixed(domain, search, "calada", "Calada", [
        { id: "MTL", label: "MTL" },
        { id: "RDL", label: "RDL" },
        { id: "DL", label: "DL" },
      ]),
    );
  }
  if (domain === "coil") {
    facets.push(
      fixed(
        domain,
        search,
        "ohm",
        "Resistencia",
        ohmBands.map((band) => ({ id: band.id, label: band.label })),
      ),
      fixed(domain, search, "hilo", "Hilo", [
        { id: "malla", label: "Malla" },
        { id: "alambre", label: "Alambre" },
        { id: "ceramica", label: "Cerámica" },
      ]),
    );
  }
  if (domain === "device") {
    facets.push(
      fixed(domain, search, "bateria", "Batería", [
        { id: "integrada", label: "Integrada" },
        { id: "externa", label: "Celda externa" },
      ]),
      fixed(
        domain,
        search,
        "potencia",
        "Potencia máxima",
        powerBands.map((band) => ({ id: band.id, label: band.label })),
      ),
    );
  }
  if (domain === "liquid") {
    facets.push(
      fixed(domain, search, "nicotina", "Nicotina", [
        { id: "sal", label: "Sales" },
        { id: "freebase", label: "Freebase" },
        { id: "ninguna", label: "Sin nicotina" },
      ]),
      fixed(domain, search, "ratio", "PG/VG", [
        { id: "50/50", label: "50/50" },
        { id: "70/30", label: "70 VG / 30 PG" },
      ]),
    );
  }
  if (domain === "coil" || domain === "device" || domain === "part") {
    facets.push(
      fixed(domain, search, "conector", "Conector", [
        { id: "510", label: "510" },
        { id: "propietario", label: "Propietario" },
      ]),
      fixed(domain, search, "plataforma", "Plataforma", platforms, "select"),
    );
  }
  return facets.filter((facet): facet is Facet => facet !== null);
}

const OHM_LABEL: Record<OhmBand, string> = {
  baja: "Menos de 0,4 Ω",
  media: "0,4 a 0,8 Ω",
  alta: "0,8 a 1,2 Ω",
  muy: "1,2 Ω o más",
};

const POWER_LABEL: Record<PowerBand, string> = {
  baja: "Hasta 30 W",
  media: "De 31 a 80 W",
  alta: "Más de 80 W",
};

export interface Chip {
  key: keyof CatalogSearch;
  label: string;
}

export function chipsFor(search: CatalogSearch): Chip[] {
  const chips: Chip[] = [];
  if (search.q) chips.push({ key: "q", label: `Texto: ${search.q}` });
  if (search.familia)
    chips.push({ key: "familia", label: taxonById(search.familia)?.es ?? search.familia });
  if (search.sub) chips.push({ key: "sub", label: taxonById(search.sub)?.es ?? search.sub });
  if (search.marca)
    chips.push({ key: "marca", label: brandById(search.marca)?.name ?? search.marca });
  if (search.calada) chips.push({ key: "calada", label: search.calada });
  if (search.ohm) chips.push({ key: "ohm", label: OHM_LABEL[search.ohm] });
  if (search.hilo)
    chips.push({
      key: "hilo",
      label: { malla: "Malla", alambre: "Alambre", ceramica: "Cerámica" }[search.hilo],
    });
  if (search.conector)
    chips.push({
      key: "conector",
      label: search.conector === "510" ? "Conector 510" : "Conector propio",
    });
  if (search.plataforma)
    chips.push({
      key: "plataforma",
      label: platformById(search.plataforma)?.name ?? search.plataforma,
    });
  if (search.bateria)
    chips.push({
      key: "bateria",
      label: search.bateria === "integrada" ? "Batería integrada" : "Celda externa",
    });
  if (search.potencia) chips.push({ key: "potencia", label: POWER_LABEL[search.potencia] });
  if (search.nicotina) {
    const label =
      search.nicotina === "sal"
        ? "Sales"
        : search.nicotina === "freebase"
          ? "Freebase"
          : "Sin nicotina";
    chips.push({ key: "nicotina", label });
  }
  if (search.ratio)
    chips.push({ key: "ratio", label: search.ratio === "70/30" ? "70 VG / 30 PG" : "50/50" });
  if (search.tpd === "si") chips.push({ key: "tpd", label: "TPD estricta" });
  return chips;
}

export function without(search: CatalogSearch, key: keyof CatalogSearch): CatalogSearch {
  const next: CatalogSearch = { ...search };
  delete next[key];
  if (key === "familia") delete next.sub;
  return next;
}

export interface ExampleQuery {
  id: string;
  domain: Domain;
  title: string;
  text: string;
  search: CatalogSearch;
}

export const exampleQueries: ExampleQuery[] = [
  {
    id: "integrada",
    domain: "coil",
    title: "Resistencia integrada",
    text: "Cápsula con el cabezal dentro. No es una resistencia suelta de tanque.",
    search: { familia: "capsula", vista: "tabla" },
  },
  {
    id: "integrada-vaporesso",
    domain: "coil",
    title: "Integrada y Vaporesso",
    text: "Las dos condiciones a la vez: montaje integrado y esa marca.",
    search: { familia: "capsula", marca: "vaporesso", vista: "tabla" },
  },
  {
    id: "integrada-oxva",
    domain: "coil",
    title: "Integrada y OXVA",
    text: "El mismo cruce con otra marca que sí tiene ficha.",
    search: { familia: "capsula", marca: "oxva", vista: "tabla" },
  },
  {
    id: "tanque-dl-malla",
    domain: "coil",
    title: "Tanque, DL y malla",
    text: "Cabezal suelto, calada directa y hilo de malla.",
    search: { familia: "tanque", calada: "DL", hilo: "malla", vista: "tabla" },
  },
  {
    id: "pod-30",
    domain: "device",
    title: "Pod hasta 30 W",
    text: "Formato de cápsula y techo de potencia de pod.",
    search: { familia: "pod", potencia: "baja", vista: "tabla" },
  },
  {
    id: "mod-externa",
    domain: "device",
    title: "Mod de celda externa",
    text: "El aparato no trae la batería. La celda es otro componente.",
    search: { familia: "mod", bateria: "externa", vista: "tabla" },
  },
  {
    id: "sales",
    domain: "liquid",
    title: "Sales de nicotina",
    text: "Formato de sales, no el shortfill a 0 mg.",
    search: { familia: "sal", nicotina: "sal", vista: "tabla" },
  },
];

export function exampleCount(example: ExampleQuery): number {
  return itemsFor(example.domain).filter((item) => matches(item, example.search)).length;
}

export interface SpecCell {
  label: string;
  value: string;
}

const TABLE_KEYS: Record<Domain, string[]> = {
  coil: ["family", "ohms", "draw", "watt_min", "watt_max", "wire_kind"],
  device: ["family", "battery_kind", "connector", "draw", "power_min_w", "power_max_w"],
  liquid: ["family", "volume_ml", "nicotine_mg", "nicotine_type", "vg", "pg"],
  part: ["kind", "spec", "quantity"],
};

export function specCells(item: CatalogItem): SpecCell[] {
  const facts = specFacts(item);
  const cells = TABLE_KEYS[item.domain].map((key) => {
    const fact = facts.find((row) => row.key === key);
    return { label: fact?.label ?? key, value: fact?.display ?? EMPTY };
  });
  if (item.domain === "coil") {
    const platform = relationRows(item).find((row) => row.key === "platforms");
    if (platform) cells.push({ label: platform.label, value: platform.value });
  }
  return cells;
}

export function factLine(item: CatalogItem): string {
  return specCells(item)
    .slice(0, 3)
    .map((cell) => cell.value)
    .join(" · ");
}

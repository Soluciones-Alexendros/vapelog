import { genreById, liquidTpd, taxonById } from "./catalog.ts";
import { confidenceLabel, formatPlain, tpdLabel } from "../components/labels.ts";
import { publishedText } from "./measures.ts";
import type { CatalogItem, Coil, Device, Domain, Draw, Liquid, Part } from "./types.ts";

export interface SpecDef {
  key: string;
  domain: Domain;
  group: string;
  groupLabel: string;
  label: string;
  unit: string | null;
  valueKind: "number" | "text" | "enum";
  filterable: boolean;
  sort: number;
  read: (item: CatalogItem) => string | null;
  confidence?: (item: CatalogItem) => string | null;
}

function num(value: number | null): string | null {
  return value == null ? null : formatPlain(value);
}

function device(item: CatalogItem): Device | null {
  return item.domain === "device" ? item : null;
}

function coil(item: CatalogItem): Coil | null {
  return item.domain === "coil" ? item : null;
}

function liquid(item: CatalogItem): Liquid | null {
  return item.domain === "liquid" ? item : null;
}

function part(item: CatalogItem): Part | null {
  return item.domain === "part" ? item : null;
}

function rangeText(min: number, max: number): string {
  return min === max ? formatPlain(min) : `${formatPlain(min)}–${formatPlain(max)}`;
}

function liquidVolumeText(item: CatalogItem): string | null {
  const row = liquid(item);
  if (!row || row.variations.length === 0) return null;
  const values = row.variations.map((variation) => variation.volumeMl);
  return rangeText(Math.min(...values), Math.max(...values));
}

function liquidNicotineText(item: CatalogItem): string | null {
  const row = liquid(item);
  if (!row) return null;
  const values = row.variations
    .filter((variation) => variation.hasNicotine && variation.nicotineMg != null)
    .map((variation) => variation.nicotineMg as number);
  if (values.length === 0) return null;
  return rangeText(Math.min(...values), Math.max(...values));
}

function liquidHasNicotine(item: CatalogItem): string | null {
  const row = liquid(item);
  if (!row) return null;
  return row.variations.some((variation) => variation.hasNicotine) ? "Sí" : "No";
}

function liquidRatio(item: CatalogItem): string | null {
  const row = liquid(item);
  return row?.variations.find((variation) => variation.ratio != null)?.ratio ?? null;
}

function liquidGenre(item: CatalogItem): string | null {
  const row = liquid(item);
  if (!row) return null;
  return genreById(row.genreId)?.es ?? row.genreId;
}

function drawText(draws: Draw[] | undefined): string | null {
  if (!draws || draws.length === 0) return null;
  return draws.join(", ");
}

function sheetConfidence(item: CatalogItem): string | null {
  return confidenceLabel(item.confidence);
}

export const specDefs: SpecDef[] = [
  def(
    "device",
    "family",
    "cuerpo",
    "Cuerpo",
    "Familia",
    null,
    "text",
    true,
    10,
    (item) => taxonById(device(item)?.familyId ?? "")?.es ?? null,
  ),
  def(
    "device",
    "series",
    "cuerpo",
    "Cuerpo",
    "Serie",
    null,
    "text",
    true,
    20,
    (item) => taxonById(device(item)?.subId ?? "")?.es ?? null,
  ),
  def("device", "year", "cuerpo", "Cuerpo", "Año", null, "number", false, 30, (item) =>
    device(item)?.year == null ? null : String(device(item)!.year),
  ),
  def("device", "materials", "cuerpo", "Cuerpo", "Materiales", null, "text", false, 40, (item) =>
    publishedText(device(item)?.materials),
  ),
  def("device", "height_mm", "cuerpo", "Cuerpo", "Alto", "mm", "number", false, 50, (item) =>
    num(device(item)?.heightMm ?? null),
  ),
  def("device", "width_mm", "cuerpo", "Cuerpo", "Ancho", "mm", "number", false, 60, (item) =>
    num(device(item)?.widthMm ?? null),
  ),
  def("device", "depth_mm", "cuerpo", "Cuerpo", "Fondo", "mm", "number", false, 70, (item) =>
    num(device(item)?.depthMm ?? null),
  ),
  def("device", "weight_g", "cuerpo", "Cuerpo", "Peso", "g", "number", false, 80, (item) =>
    num(device(item)?.weightG ?? null),
  ),
  def("device", "display", "cuerpo", "Cuerpo", "Pantalla", null, "text", false, 90, (item) => {
    const row = device(item);
    if (!row) return null;
    const parts: string[] = [];
    if (row.displayKind) parts.push(row.displayKind);
    if (row.displaySizeIn != null) parts.push(`${formatPlain(row.displaySizeIn)} ″`);
    return parts.length ? parts.join(" · ") : null;
  }),
  def("device", "chipset", "cuerpo", "Cuerpo", "Chip", null, "text", false, 100, (item) =>
    publishedText(device(item)?.chipset),
  ),
  def("device", "modes", "cuerpo", "Cuerpo", "Modos", null, "text", false, 110, (item) => {
    const modes = device(item)?.modes ?? [];
    return modes.length ? modes.join(" · ") : null;
  }),
  def(
    "device",
    "battery_kind",
    "alimentacion",
    "Alimentación",
    "Tipo de batería",
    null,
    "enum",
    true,
    120,
    (item) => {
      const kind = device(item)?.batteryKind;
      if (kind === "integrada") return "Integrada";
      if (kind === "externa") return "Celda externa";
      return null;
    },
  ),
  def(
    "device",
    "battery_mah",
    "alimentacion",
    "Alimentación",
    "Capacidad de batería",
    "mAh",
    "number",
    true,
    130,
    (item) => num(device(item)?.batteryMah ?? null),
    sheetConfidence,
  ),
  def(
    "device",
    "cell",
    "alimentacion",
    "Alimentación",
    "Celda",
    null,
    "enum",
    true,
    140,
    (item) => {
      const row = device(item);
      if (!row) return null;
      if (row.cellCount != null && row.cellType != null)
        return `${row.cellCount} × ${row.cellType}`;
      if (row.cellCount != null) return String(row.cellCount);
      return row.cellType;
    },
  ),
  def(
    "device",
    "charge_rate",
    "alimentacion",
    "Alimentación",
    "Carga",
    null,
    "text",
    false,
    160,
    (item) => {
      const row = device(item);
      if (!row || row.chargePort == null) return null;
      const rate =
        row.chargeVolts != null && row.chargeAmps != null
          ? `${formatPlain(row.chargeVolts)} V / ${formatPlain(row.chargeAmps)} A`
          : row.chargeVolts != null
            ? `${formatPlain(row.chargeVolts)} V`
            : row.chargeAmps != null
              ? `${formatPlain(row.chargeAmps)} A`
              : null;
      return rate ? `${row.chargePort} · ${rate}` : row.chargePort;
    },
  ),
  def(
    "device",
    "power_min_w",
    "alimentacion",
    "Alimentación",
    "Potencia mínima",
    "W",
    "number",
    true,
    190,
    (item) => num(device(item)?.powerMinW ?? null),
    sheetConfidence,
  ),
  def(
    "device",
    "power_max_w",
    "alimentacion",
    "Alimentación",
    "Potencia máxima",
    "W",
    "number",
    true,
    200,
    (item) => num(device(item)?.powerMaxW ?? null),
    sheetConfidence,
  ),
  def(
    "device",
    "ohm_min",
    "electrico",
    "Ventana eléctrica",
    "Ohmios mínimos",
    "Ω",
    "number",
    true,
    210,
    (item) => num(device(item)?.ohmMin ?? null),
    sheetConfidence,
  ),
  def(
    "device",
    "ohm_max",
    "electrico",
    "Ventana eléctrica",
    "Ohmios máximos",
    "Ω",
    "number",
    true,
    220,
    (item) => num(device(item)?.ohmMax ?? null),
    sheetConfidence,
  ),
  def(
    "device",
    "connector",
    "electrico",
    "Ventana eléctrica",
    "Conector de la pieza",
    null,
    "enum",
    true,
    230,
    (item) => connector(device(item)?.connector),
  ),
  def(
    "device",
    "capacity_ml",
    "atomizador",
    "Atomizador",
    "Depósito",
    "ml",
    "number",
    true,
    240,
    (item) => num(device(item)?.capacityMl ?? null),
    sheetConfidence,
  ),
  def(
    "device",
    "capacity_tpd_ml",
    "atomizador",
    "Atomizador",
    "Depósito TPD",
    "ml",
    "number",
    true,
    250,
    (item) => num(device(item)?.capacityTpdMl ?? null),
    sheetConfidence,
  ),
  def("device", "airflow", "atomizador", "Atomizador", "Aire", null, "text", false, 260, (item) =>
    publishedText(device(item)?.airflow),
  ),
  def("device", "draw", "atomizador", "Atomizador", "Calada", null, "enum", true, 270, (item) =>
    drawText(device(item)?.draws),
  ),
  def("device", "tpd", "regimen", "Fuente", "TPD", null, "enum", true, 280, (item) =>
    device(item) ? tpdLabel(device(item)!.tpd) : null,
  ),

  def(
    "coil",
    "family",
    "construccion",
    "Construcción",
    "Montaje",
    null,
    "text",
    true,
    10,
    (item) => taxonById(coil(item)?.familyId ?? "")?.es ?? null,
  ),
  def(
    "coil",
    "series",
    "construccion",
    "Construcción",
    "Serie",
    null,
    "text",
    true,
    20,
    (item) => taxonById(coil(item)?.subId ?? "")?.es ?? null,
  ),
  def(
    "coil",
    "wire_kind",
    "construccion",
    "Construcción",
    "Hilo",
    null,
    "enum",
    true,
    30,
    (item) => {
      const row = coil(item);
      if (!row) return null;
      const kind =
        row.wireKind == null
          ? null
          : { malla: "Malla", "doble-malla": "Doble malla", alambre: "Alambre" }[row.wireKind];
      if (kind && row.wireMaterial) return `${kind} · ${row.wireMaterial}`;
      return kind ?? publishedText(row.wireMaterial);
    },
  ),
  def(
    "coil",
    "build",
    "construccion",
    "Construcción",
    "Construcción",
    null,
    "text",
    false,
    50,
    (item) => {
      const build = coil(item)?.build;
      if (!build) return null;
      return { malla: "Malla", "doble-malla": "Doble malla", capsula: "Cápsula" }[build];
    },
  ),
  def("coil", "draw", "construccion", "Construcción", "Calada", null, "enum", true, 60, (item) =>
    drawText(coil(item)?.draws),
  ),
  def(
    "coil",
    "connector",
    "construccion",
    "Construcción",
    "Conector de la pieza",
    null,
    "enum",
    true,
    70,
    (item) => connector(coil(item)?.connector),
  ),
  def(
    "coil",
    "refillable",
    "construccion",
    "Construcción",
    "Rellenable",
    null,
    "enum",
    true,
    80,
    (item) => (coil(item) ? (coil(item)!.refillable ? "Sí" : "No") : null),
  ),
  def(
    "coil",
    "pack_count",
    "variante",
    "Variante de empaque",
    "Unidades",
    null,
    "number",
    false,
    90,
    (item) => num(coil(item)?.packCount ?? null),
  ),
  def(
    "coil",
    "ohms",
    "electrico",
    "Eléctrico",
    "Resistencia",
    "Ω",
    "number",
    true,
    110,
    (item) => (coil(item) ? formatPlain(coil(item)!.ohms) : null),
    sheetConfidence,
  ),
  def(
    "coil",
    "watt_min",
    "electrico",
    "Eléctrico",
    "Vatios mínimos",
    "W",
    "number",
    true,
    120,
    (item) => num(coil(item)?.wattMin ?? null),
  ),
  def(
    "coil",
    "watt_max",
    "electrico",
    "Eléctrico",
    "Vatios máximos",
    "W",
    "number",
    true,
    130,
    (item) => num(coil(item)?.wattMax ?? null),
  ),

  def("liquid", "line", "formato", "Formato", "Línea", null, "text", false, 10, (item) =>
    publishedText(liquid(item)?.line),
  ),
  def("liquid", "genre", "formato", "Formato", "Género", "", "enum", true, 20, liquidGenre),
  def(
    "liquid",
    "volume_ml",
    "formato",
    "Formato",
    "Cantidad",
    "ml",
    "number",
    true,
    30,
    liquidVolumeText,
    sheetConfidence,
  ),
  def("liquid", "ratio", "formato", "Formato", "VG/PG", null, "text", false, 40, liquidRatio),
  def(
    "liquid",
    "has_nicotine",
    "nicotina",
    "Nicotina",
    "Nicotina",
    "",
    "enum",
    true,
    60,
    liquidHasNicotine,
  ),
  def(
    "liquid",
    "nicotine_mg",
    "nicotina",
    "Nicotina",
    "Cantidad de nicotina",
    "mg/ml",
    "number",
    true,
    70,
    liquidNicotineText,
    sheetConfidence,
  ),
  def("liquid", "draw", "uso", "Uso", "Calada recomendada", null, "enum", true, 100, (item) =>
    drawText(liquid(item)?.draws),
  ),
  def("liquid", "flavors", "uso", "Uso", "Perfil", null, "text", false, 110, (item) => {
    const names = (liquid(item)?.flavorIds ?? [])
      .map((id) => taxonById(id)?.es)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(" · ") : null;
  }),
  def("liquid", "tpd", "regimen", "Fuente", "TPD", null, "enum", true, 120, (item) =>
    liquid(item) ? tpdLabel(liquidTpd(liquid(item)!)) : null,
  ),

  def(
    "part",
    "family",
    "encaje",
    "Encaje",
    "Familia",
    null,
    "text",
    true,
    10,
    (item) => taxonById(part(item)?.familyId ?? "")?.es ?? null,
  ),
  def(
    "part",
    "series",
    "encaje",
    "Encaje",
    "Serie",
    null,
    "text",
    true,
    15,
    (item) => taxonById(part(item)?.subId ?? "")?.es ?? null,
  ),
  def(
    "part",
    "spec",
    "encaje",
    "Encaje",
    "Especificación publicada",
    null,
    "text",
    false,
    20,
    (item) => publishedText(part(item)?.spec),
  ),
  def("part", "quantity", "encaje", "Encaje", "Cantidad", null, "text", false, 30, (item) =>
    publishedText(part(item)?.quantityNote),
  ),
  def(
    "part",
    "drip_mm",
    "encaje",
    "Encaje",
    "Diámetro de boquilla",
    "mm",
    "number",
    false,
    40,
    () => null,
  ),
  def(
    "part",
    "chemistry",
    "encaje",
    "Encaje",
    "Química de la celda",
    null,
    "text",
    false,
    50,
    () => null,
  ),
  def(
    "part",
    "amps",
    "encaje",
    "Encaje",
    "Amperaje continuo",
    "A",
    "number",
    false,
    60,
    () => null,
  ),
  def(
    "part",
    "fits_battery",
    "encaje",
    "Encaje",
    "Pide celda",
    null,
    "enum",
    true,
    70,
    (item) => part(item)?.fitsBattery ?? null,
  ),
  def(
    "part",
    "fits_connector",
    "encaje",
    "Encaje",
    "Pide conector",
    null,
    "enum",
    true,
    80,
    (item) => part(item)?.fitsConnector ?? null,
  ),
];

function connector(value: "510" | "propietario" | undefined): string | null {
  if (!value) return null;
  return value === "510" ? "510" : "Propietario";
}

function def(
  domain: Domain,
  key: string,
  group: string,
  groupLabel: string,
  label: string,
  unit: string | null,
  valueKind: SpecDef["valueKind"],
  filterable: boolean,
  sort: number,
  read: (item: CatalogItem) => string | null,
  confidence?: (item: CatalogItem) => string | null,
): SpecDef {
  return {
    domain,
    key,
    group,
    groupLabel,
    label,
    unit,
    valueKind,
    filterable,
    sort,
    read,
    confidence,
  };
}

export function defsFor(domain: Domain): SpecDef[] {
  return specDefs.filter((row) => row.domain === domain).sort((a, b) => a.sort - b.sort);
}

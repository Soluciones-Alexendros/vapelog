import { taxonById } from "./catalog.ts";
import { confidenceLabel, formatPlain, tpdLabel } from "../components/labels.ts";
import {
  batteryKind,
  batteryMah,
  cellFormat,
  chargePort,
  dimensionsMm,
  packCount,
  parseDraws,
  publishedText,
  ratioParts,
  singleMl,
  weightGrams,
  wireKind,
} from "./measures.ts";
import type { CatalogItem, Coil, Device, Domain, Liquid, Part } from "./types.ts";

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

function sheetConfidence(item: CatalogItem): string | null {
  return confidenceLabel(item.confidence);
}

function wattConfidence(item: CatalogItem): string | null {
  const row = coil(item);
  if (!row?.wattConfidence) return null;
  return confidenceLabel(row.wattConfidence);
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
    num(dimensionsMm(device(item)?.dimensions)?.height ?? null),
  ),
  def("device", "width_mm", "cuerpo", "Cuerpo", "Ancho", "mm", "number", false, 60, (item) =>
    num(dimensionsMm(device(item)?.dimensions)?.width ?? null),
  ),
  def("device", "depth_mm", "cuerpo", "Cuerpo", "Fondo", "mm", "number", false, 70, (item) =>
    num(dimensionsMm(device(item)?.dimensions)?.depth ?? null),
  ),
  def("device", "weight_g", "cuerpo", "Cuerpo", "Peso", "g", "number", false, 80, (item) =>
    num(weightGrams(device(item)?.weight)),
  ),
  def("device", "display", "cuerpo", "Cuerpo", "Pantalla", null, "text", false, 90, (item) =>
    publishedText(device(item)?.display),
  ),
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
      const battery = device(item)?.battery;
      return battery
        ? batteryKind(battery) === "integrada"
          ? "Integrada"
          : batteryKind(battery) === "externa"
            ? "Celda externa"
            : null
        : null;
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
    (item) => num(device(item) ? batteryMah(device(item)!.battery) : null),
    sheetConfidence,
  ),
  def("device", "cell", "alimentacion", "Alimentación", "Celda", null, "enum", true, 140, (item) =>
    device(item) ? cellFormat(device(item)!.battery) : null,
  ),
  def(
    "device",
    "battery_note",
    "alimentacion",
    "Alimentación",
    "Frase de batería",
    null,
    "text",
    false,
    150,
    (item) => publishedText(device(item)?.battery),
  ),
  def(
    "device",
    "charge_port",
    "alimentacion",
    "Alimentación",
    "Puerto de carga",
    null,
    "enum",
    true,
    160,
    (item) => (device(item) ? chargePort(device(item)!.charge) : null),
  ),
  def(
    "device",
    "charge_note",
    "alimentacion",
    "Alimentación",
    "Frase de carga",
    null,
    "text",
    false,
    170,
    (item) => publishedText(device(item)?.charge),
  ),
  def(
    "device",
    "power_note",
    "alimentacion",
    "Alimentación",
    "Potencia publicada",
    null,
    "text",
    false,
    180,
    (item) => publishedText(device(item)?.power),
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
    (item) => num(singleMl(device(item)?.capacity)),
    sheetConfidence,
  ),
  def(
    "device",
    "capacity_note",
    "atomizador",
    "Atomizador",
    "Frase de depósito",
    null,
    "text",
    false,
    250,
    (item) => publishedText(device(item)?.capacity),
  ),
  def("device", "airflow", "atomizador", "Atomizador", "Aire", null, "text", false, 260, (item) =>
    publishedText(device(item)?.airflow),
  ),
  def("device", "draw", "atomizador", "Atomizador", "Calada", null, "enum", true, 270, (item) => {
    const draws = parseDraws(device(item)?.draw);
    return draws.length ? draws.join(" · ") : null;
  }),
  def("device", "tpd", "regimen", "Régimen y fuente", "TPD", null, "enum", true, 280, (item) =>
    device(item) ? tpdLabel(device(item)!.tpd) : null,
  ),
  def(
    "device",
    "confidence",
    "regimen",
    "Régimen y fuente",
    "Confianza de la ficha",
    null,
    "enum",
    false,
    290,
    (item) => sheetConfidence(item),
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
      const kind = wireKind(row.wire, row.build);
      return kind ? { malla: "Malla", alambre: "Alambre", ceramica: "Cerámica" }[kind] : null;
    },
  ),
  def(
    "coil",
    "wire_note",
    "construccion",
    "Construcción",
    "Material del hilo",
    null,
    "text",
    false,
    40,
    (item) => publishedText(coil(item)?.wire),
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
    (item) => publishedText(coil(item)?.build),
  ),
  def(
    "coil",
    "draw",
    "construccion",
    "Construcción",
    "Calada",
    null,
    "enum",
    true,
    60,
    (item) => coil(item)?.draw ?? null,
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
    (item) => num(coil(item) ? packCount(coil(item)!.pack) : null),
  ),
  def(
    "coil",
    "pack_note",
    "variante",
    "Variante de empaque",
    "Frase de empaque",
    null,
    "text",
    false,
    100,
    (item) => publishedText(coil(item)?.pack),
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
    wattConfidence,
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
    wattConfidence,
  ),
  def(
    "coil",
    "confidence",
    "regimen",
    "Fuente",
    "Confianza de la ficha",
    null,
    "enum",
    false,
    140,
    (item) => sheetConfidence(item),
  ),

  def("liquid", "line", "formato", "Formato", "Línea", null, "text", false, 10, (item) =>
    publishedText(liquid(item)?.line),
  ),
  def(
    "liquid",
    "family",
    "formato",
    "Formato",
    "Formato",
    null,
    "text",
    true,
    20,
    (item) => taxonById(liquid(item)?.familyId ?? "")?.es ?? null,
  ),
  def(
    "liquid",
    "volume_ml",
    "formato",
    "Formato",
    "Volumen",
    "ml",
    "number",
    true,
    30,
    (item) => (liquid(item) ? formatPlain(liquid(item)!.volumeMl) : null),
    sheetConfidence,
  ),
  def("liquid", "bottle", "formato", "Formato", "Botella", null, "text", false, 40, (item) =>
    publishedText(liquid(item)?.bottle),
  ),
  def(
    "liquid",
    "assumed_bottle_ml",
    "formato",
    "Formato",
    "Botella resultante",
    "ml",
    "number",
    false,
    50,
    (item) => num(liquid(item)?.assumedBottleMl ?? null),
  ),
  def(
    "liquid",
    "nicotine_mg",
    "nicotina",
    "Nicotina",
    "Nicotina",
    "mg/ml",
    "number",
    true,
    60,
    (item) => (liquid(item) ? formatPlain(liquid(item)!.nicotineMg) : null),
    sheetConfidence,
  ),
  def("liquid", "nicotine_type", "nicotina", "Nicotina", "Tipo", null, "enum", true, 70, (item) => {
    const row = liquid(item);
    if (!row) return null;
    if (row.nicotineType === "sal") return "Sales";
    if (row.nicotineType === "freebase") return "Freebase";
    return "Sin nicotina";
  }),
  def(
    "liquid",
    "vg",
    "nicotina",
    "Nicotina",
    "VG",
    "%",
    "number",
    true,
    80,
    (item) => num(ratioParts(liquid(item)?.ratio ?? null)?.vg ?? null),
    sheetConfidence,
  ),
  def(
    "liquid",
    "pg",
    "nicotina",
    "Nicotina",
    "PG",
    "%",
    "number",
    true,
    90,
    (item) => num(ratioParts(liquid(item)?.ratio ?? null)?.pg ?? null),
    sheetConfidence,
  ),
  def("liquid", "draw", "uso", "Uso", "Calada recomendada", null, "enum", true, 100, (item) => {
    const draws = liquid(item)?.recommendedDraw ?? [];
    return draws.length ? draws.join(" · ") : null;
  }),
  def("liquid", "flavors", "uso", "Uso", "Perfil", null, "text", false, 110, (item) => {
    const names = (liquid(item)?.flavorIds ?? [])
      .map((id) => taxonById(id)?.es)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(" · ") : null;
  }),
  def("liquid", "tpd", "regimen", "Régimen y fuente", "TPD", null, "enum", true, 120, (item) =>
    liquid(item) ? tpdLabel(liquid(item)!.tpd) : null,
  ),
  def(
    "liquid",
    "confidence",
    "regimen",
    "Régimen y fuente",
    "Confianza de la ficha",
    null,
    "enum",
    false,
    130,
    (item) => sheetConfidence(item),
  ),

  def("part", "kind", "encaje", "Encaje", "Tipo", null, "enum", true, 10, (item) =>
    part(item)?.kind === "bateria" ? "Batería" : part(item) ? "Boquilla" : null,
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
  def(
    "part",
    "confidence",
    "regimen",
    "Fuente",
    "Confianza de la ficha",
    null,
    "enum",
    false,
    90,
    (item) => sheetConfidence(item),
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

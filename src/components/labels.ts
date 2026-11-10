import { formatRatioLabel } from "../data/measures.ts";
import { knownNicotineMgPerMl, type LiquidFitKind } from "../data/logic.ts";
import { aggregateVariationTpd } from "../data/tpd.ts";
import type {
  CatalogItem,
  CompatKind,
  Confidence,
  Domain,
  LiquidVariation,
  TpdStatus,
} from "../data/types.ts";

export type Tone = "success" | "warning" | "info" | "primary" | "muted";

const numberFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function formatPlain(value: number): string {
  return numberFormat.format(value);
}

export function confidenceLabel(confidence: Confidence): string {
  if (confidence === "fabricante") return "Fabricante";
  if (confidence === "ficha") return "Ficha técnica";
  return "Distribuidor";
}

export function itemTpd(item: CatalogItem): TpdStatus {
  if (item.domain === "device") return item.tpd;
  if (item.domain === "coil") return item.tpd ?? "desconocido";
  if (item.domain === "part") return "no-aplica";
  return aggregateVariationTpd(item);
}

export function tpdLabel(status: TpdStatus): string {
  if (status === "si") return "TPD";
  if (status === "parcial") return "TPD parcial";
  if (status === "incompleto") return "TPD incompleto";
  if (status === "no") return "Declarado fuera de TPD";
  if (status === "no-aplica") return "No aplica";
  return "Sin dato publicado";
}

export function tpdTone(status: TpdStatus): Tone {
  if (status === "si") return "success";
  if (status === "parcial") return "warning";
  if (status === "incompleto") return "info";
  if (status === "no") return "warning";
  if (status === "no-aplica") return "muted";
  return "muted";
}

export function domainLabel(domain: Domain): string {
  if (domain === "device") return "Dispositivo";
  if (domain === "coil") return "Resistencia";
  if (domain === "part") return "Componente";
  return "Líquido";
}

export function domainPath(
  domain: Domain,
): "/dispositivos" | "/resistencias" | "/liquidos" | "/componentes" {
  if (domain === "device") return "/dispositivos";
  if (domain === "coil") return "/resistencias";
  if (domain === "part") return "/componentes";
  return "/liquidos";
}

export function compatLabel(kind: CompatKind): string {
  if (kind === "nativa") return "Encaja en la plataforma";
  if (kind === "kit") return "Encaja en el tanque del kit";
  if (kind === "electrica") return "Solo cruce eléctrico";
  return "No encaja";
}

/** Etiquetas en español para EvaluationStatus (ADR-0016 / UX compatibilidad). */
export function evaluationStatusLabel(
  status: "match" | "mismatch" | "unknown" | "conditional" | "not_applicable",
): string {
  if (status === "match") return "Coincide";
  if (status === "mismatch") return "No coincide";
  if (status === "unknown") return "Información insuficiente";
  if (status === "conditional") return "Condicional";
  return "No aplica";
}

export function compatTone(kind: CompatKind): Tone {
  if (kind === "nativa") return "success";
  if (kind === "kit") return "success";
  if (kind === "electrica") return "info";
  return "warning";
}

type DimensionStatus = "match" | "mismatch" | "unknown" | "conditional" | "not_applicable";

/** Tono del bloque de relación en CompatLab: sin éxito global si una dimensión aplicable es unknown. */
export function compatLabTone(input: {
  kind: CompatKind;
  physical: DimensionStatus;
  electrical: DimensionStatus;
  operating: DimensionStatus;
}): Tone {
  if (input.kind === "no") return "warning";
  if (input.physical === "mismatch") return "warning";
  const applicableUnknown =
    input.electrical === "unknown" ||
    (input.operating === "unknown" && input.physical !== "not_applicable");
  if (applicableUnknown) return "info";
  return compatTone(input.kind);
}

export function fitLabel(fit: LiquidFitKind): string {
  if (fit === "directo") return "Encaje directo";
  if (fit === "posible") return "Se puede usar";
  if (fit === "preparacion") return "Requiere preparación";
  return "Mejor evitar";
}

const UNPUBLISHED_SHORT = "Sin dato publicado";

/** Datos de variante visibles en CompatLab (etiqueta, volumen, nicotina, ratio). */
export function liquidFitVariationMeta(
  variation: LiquidVariation,
  requiresPreparation: boolean,
): {
  variantLabel: string;
  volumeText: string;
  nicotineText: string;
  ratioText: string;
  preparationNote: string | null;
} {
  const volumeText =
    variation.fillVolumeMl != null && Number.isFinite(variation.fillVolumeMl)
      ? `${formatPlain(variation.fillVolumeMl)} ml`
      : UNPUBLISHED_SHORT;
  const mg = knownNicotineMgPerMl(variation);
  const nicotineText =
    mg == null ? UNPUBLISHED_SHORT : mg > 0 ? `${formatPlain(mg)} mg/ml` : "0 mg/ml";
  const ratio = formatRatioLabel(variation.ratioVgPct, variation.ratioPgPct);
  return {
    variantLabel: variation.label,
    volumeText,
    nicotineText,
    ratioText: ratio ?? UNPUBLISHED_SHORT,
    preparationNote: requiresPreparation ? "Requiere preparación" : null,
  };
}

export function fitTone(fit: LiquidFitKind): Tone {
  if (fit === "directo") return "success";
  if (fit === "posible") return "info";
  if (fit === "preparacion") return "primary";
  return "warning";
}

export function toneTextClass(tone: Tone): string {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "info") return "text-info";
  if (tone === "primary") return "text-primary";
  return "text-muted-foreground";
}

export function toneBorderClass(tone: Tone): string {
  if (tone === "success") return "border-success";
  if (tone === "warning") return "border-warning";
  if (tone === "info") return "border-info";
  if (tone === "primary") return "border-primary";
  return "border-border";
}

export function toneBgClass(tone: Tone): string {
  if (tone === "success") return "bg-success/10";
  if (tone === "warning") return "bg-warning/10";
  if (tone === "info") return "bg-info/10";
  if (tone === "primary") return "bg-primary/10";
  return "bg-muted";
}

import type { LiquidFitKind } from "@/data/logic";
import type { CatalogItem, CompatKind, Confidence, Domain, TpdStatus } from "@/data/types";

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
  if (item.domain === "coil") return item.tpd ?? "no-aplica";
  if (item.domain === "part") return "no-aplica";
  const statuses = item.variations
    .map((variation) => variation.tpd)
    .filter((status): status is TpdStatus => status != null);
  if (statuses.length === 0) return "no-aplica";
  if (statuses.every((status) => status === statuses[0])) return statuses[0]!;
  return "parcial";
}

export function tpdLabel(status: TpdStatus): string {
  if (status === "si") return "TPD";
  if (status === "parcial") return "TPD parcial";
  if (status === "no") return "Fuera de TPD";
  return "Sin depósito";
}

export function tpdTone(status: TpdStatus): Tone {
  if (status === "si") return "success";
  if (status === "parcial") return "warning";
  if (status === "no") return "warning";
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

export function compatTone(kind: CompatKind): Tone {
  if (kind === "nativa") return "success";
  if (kind === "kit") return "success";
  if (kind === "electrica") return "info";
  return "warning";
}

export function fitLabel(fit: LiquidFitKind): string {
  if (fit === "directo") return "Encaje directo";
  if (fit === "posible") return "Se puede usar";
  return "Mejor evitar";
}

export function fitTone(fit: LiquidFitKind): Tone {
  if (fit === "directo") return "success";
  if (fit === "posible") return "info";
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

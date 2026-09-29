import type { CatalogItem, Confidence, Domain, TpdStatus } from "@/data/types";

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
  if (item.domain === "coil" || item.domain === "part") return "no-aplica";
  if (item.domain === "liquid") {
    const statuses = item.variations
      .map((variation) => variation.tpd)
      .filter((status): status is TpdStatus => status != null);
    if (statuses.length === 0) return "no-aplica";
    if (statuses.every((status) => status === statuses[0])) return statuses[0]!;
    return "parcial";
  }
  return item.tpd;
}

export function tpdLabel(status: TpdStatus): string {
  if (status === "si") return "TPD";
  if (status === "parcial") return "TPD parcial";
  if (status === "no") return "Fuera de TPD";
  return "Sin depósito";
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

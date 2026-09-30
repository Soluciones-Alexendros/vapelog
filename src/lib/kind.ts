import type { Domain } from "../data/types";

export type Kind = "dispositivo" | "resistencia" | "liquido" | "componente";

export const DOMAIN_TO_KIND: Record<Domain, Kind> = {
  device: "dispositivo",
  coil: "resistencia",
  liquid: "liquido",
  part: "componente",
};

export const KIND_LABEL: Record<Kind, { short: string; full: string }> = {
  dispositivo: { short: "DISP", full: "Dispositivo" },
  resistencia: { short: "RES", full: "Resistencia" },
  liquido: { short: "LÍQ", full: "Líquido" },
  componente: { short: "COMP", full: "Componente" },
};

export function kindOf(domain: Domain): Kind {
  return DOMAIN_TO_KIND[domain];
}

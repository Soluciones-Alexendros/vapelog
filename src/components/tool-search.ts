export type OhmInputMode = "watts" | "volts";

export interface ToolSearch {
  tab?: "ohm" | "nicokit";
  /** Modo explícito de la calculadora Ohm (`watts` | `volts`). */
  modo?: OhmInputMode;
  ohms?: string;
  watts?: string;
  volts?: string;
  device?: string;
  aroma?: string;
  botella?: string;
  shotMl?: string;
  shotMg?: string;
  shots?: string;
  objetivo?: string;
}

/** Ejemplo de shortfill citado en la ayuda de Nicokit (anclado por prueba). */
export const NICOKIT_EXAMPLE = {
  initialZeroMgMl: 50,
  bottleMl: 60,
  shotMl: 10,
  shotMg: 20,
  shots: 1,
} as const;

function parseOhmModo(value: unknown): OhmInputMode | undefined {
  if (value === "watts" || value === "volts") return value;
  return undefined;
}

/** Resuelve el modo activo de Ohm según el contrato de precedencia URL. */
export function resolveOhmMode(search: Pick<ToolSearch, "modo" | "volts">): OhmInputMode {
  if (search.modo === "watts" || search.modo === "volts") return search.modo;
  const volts = search.volts;
  if (volts != null && volts !== "") return "volts";
  return "watts";
}

/** Estado coherente de búsqueda al cambiar de modo (historial `push`). */
export function ohmModeForSearch(mode: OhmInputMode, search: ToolSearch): ToolSearch {
  return {
    ...search,
    tab: "ohm",
    modo: mode,
    ...(mode === "watts" ? { volts: undefined } : { watts: undefined }),
  };
}

export function ohmModeChanged(before: ToolSearch, after: ToolSearch): boolean {
  return resolveOhmMode(before) !== resolveOhmMode(after);
}

export function parseToolSearch(search: Record<string, unknown>): ToolSearch {
  // TanStack puede tipar `?aroma=50` como number; hay que rehidratar a string.
  const text = (key: string): string | undefined => {
    const value = search[key];
    if (typeof value === "string") return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return undefined;
  };
  const tab = search.tab === "nicokit" ? "nicokit" : search.tab === "ohm" ? "ohm" : undefined;
  return {
    tab,
    modo: parseOhmModo(search.modo),
    ohms: text("ohms"),
    watts: text("watts"),
    volts: text("volts"),
    device: text("device"),
    aroma: text("aroma"),
    botella: text("botella"),
    shotMl: text("shotMl"),
    shotMg: text("shotMg"),
    shots: text("shots"),
    objetivo: text("objetivo"),
  };
}

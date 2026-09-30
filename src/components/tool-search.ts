export interface ToolSearch {
  tab?: "ohm" | "nicokit";
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

export function parseToolSearch(search: Record<string, unknown>): ToolSearch {
  const text = (key: string) => (typeof search[key] === "string" ? search[key] : undefined);
  const tab = search.tab === "nicokit" ? "nicokit" : search.tab === "ohm" ? "ohm" : undefined;
  return {
    tab,
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

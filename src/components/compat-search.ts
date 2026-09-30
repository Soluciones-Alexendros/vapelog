export interface CompatSearch {
  device?: string;
  coil?: string;
}

export function parseCompatSearch(search: Record<string, unknown>): CompatSearch {
  return {
    device: typeof search.device === "string" ? search.device : undefined,
    coil: typeof search.coil === "string" ? search.coil : undefined,
  };
}

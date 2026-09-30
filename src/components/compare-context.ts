import { createContext, useContext } from "react";
import type { Domain } from "@/data/types";

export interface CompareRef {
  domain: Domain;
  slug: string;
}

export const CompareContext = createContext<{
  items: CompareRef[];
  notice: string | null;
  toggle: (item: CompareRef) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
} | null>(null);

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error("Comparador fuera de sitio");
  return value;
}

import { useSyncExternalStore } from "react";

export type FxPreference = "on" | "off";

const STORAGE_KEY = "vapelog-fx";

function isFxPreference(value: string | null): value is FxPreference {
  return value === "on" || value === "off";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Preferencia efectiva en cliente: manda el valor guardado; si no existe, se
 * respeta `prefers-reduced-motion` (off) y en su defecto se activa (on).
 */
export function getFxPreference(): FxPreference {
  if (typeof localStorage === "undefined") return "off";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isFxPreference(stored)) return stored;
  return prefersReducedMotion() ? "off" : "on";
}

/**
 * Snapshot de SSR/hidratación: sin `localStorage` ni `matchMedia` el valor
 * conservador es "off". React revalida contra el snapshot de cliente tras
 * hidratar, así que no hay desajuste de markup.
 */
export function getServerFxPreference(): FxPreference {
  return "off";
}

const fxListeners = new Set<() => void>();

function emitFx() {
  fxListeners.forEach((listener) => {
    listener();
  });
}

export function subscribeFx(callback: () => void): () => void {
  fxListeners.add(callback);
  window.addEventListener("storage", callback);
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => {
    fxListeners.delete(callback);
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

export function setFxPreference(value: FxPreference): void {
  localStorage.setItem(STORAGE_KEY, value);
  emitFx();
}

export function useFx(): FxPreference {
  return useSyncExternalStore(subscribeFx, getFxPreference, getServerFxPreference);
}

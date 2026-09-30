import { useSyncExternalStore } from "react";
import {
  decide,
  readPref,
  writePref,
  type FxMode,
  type FxPref,
  type FxReason,
} from "@/lib/fx/controller";
import { wantsReducedData } from "@/lib/fx/env";

export type { FxMode, FxPref, FxReason };
export {
  decide,
  FX_STORAGE_KEY,
  FX_STORAGE_KEY_LEGACY,
  indexToTier,
  initialTierIndex,
  isFxPref,
  readPref,
  TierGovernor,
  tierToIndex,
  writePref,
} from "@/lib/fx/controller";

export type FxDecision = { mode: FxMode; reason: FxReason; pref: FxPref };

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function getFxPreference(): FxPref {
  return readPref();
}

export function getServerFxPreference(): FxPref {
  return "auto";
}

/** Snapshot SSR: sin matchMedia el modo conservador es off. */
export function getServerFxMode(): FxMode {
  return "off";
}

export function getServerFxReason(): FxReason {
  return "not-mounted";
}

export function getFxDecision(): FxDecision {
  const pref = readPref();
  const { mode, reason } = decide(pref, {
    reduced: prefersReducedMotion(),
    saveData: wantsReducedData(),
  });
  return { mode, reason, pref };
}

export function getFxMode(): FxMode {
  return getFxDecision().mode;
}

export function getFxReason(): FxReason {
  return getFxDecision().reason;
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
  let dataMedia: MediaQueryList | null = null;
  try {
    dataMedia = window.matchMedia("(prefers-reduced-data: reduce)");
    dataMedia.addEventListener("change", callback);
  } catch {
    dataMedia = null;
  }
  return () => {
    fxListeners.delete(callback);
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
    dataMedia?.removeEventListener("change", callback);
  };
}

export function setFxPreference(value: FxPref): void {
  writePref(value);
  emitFx();
  if (typeof document !== "undefined") {
    document.documentElement.dataset.fx = getFxMode();
  }
}

/** Preferencia del conmutador (auto|on|off) — primitivo estable. */
export function useFxPref(): FxPref {
  return useSyncExternalStore(subscribeFx, getFxPreference, getServerFxPreference);
}

/** Modo efectivo — primitivo estable para useSyncExternalStore. */
export function useFx(): FxMode {
  return useSyncExternalStore(subscribeFx, getFxMode, getServerFxMode);
}

export function useFxReason(): FxReason {
  return useSyncExternalStore(subscribeFx, getFxReason, getServerFxReason);
}

/** Decisión agregada (pref + mode + reason) para UI de debug. */
export function useFxDecision(): FxDecision {
  const pref = useFxPref();
  const mode = useFx();
  const reason = useFxReason();
  return { pref, mode, reason };
}

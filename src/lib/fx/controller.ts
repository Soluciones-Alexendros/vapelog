/** Preferencia persistida del usuario (conmutador Auto · On · Off). */
export type FxPref = "auto" | "on" | "off";

/** Motivo consultable cuando un efecto se apaga o degrada. */
export type FxReason =
  | "ok"
  | "reduced-motion"
  | "user-off"
  | "save-data"
  | "tier-degraded"
  | "not-mounted"
  | "ctx-null"
  | "chunk-failed";

/** Modo efectivo tras decidir preferencia + entorno. */
export type FxMode = "animated" | "static" | "off";

export const FX_STORAGE_KEY = "vapelog-fx:v2";
/** Clave legacy (on/off). Se migra a `auto` si el valor no es reconocible. */
export const FX_STORAGE_KEY_LEGACY = "vapelog-fx";

export function isFxPref(value: string | null | undefined): value is FxPref {
  return value === "auto" || value === "on" || value === "off";
}

export function readPref(): FxPref {
  try {
    if (typeof localStorage === "undefined") return "auto";
    const v2 = localStorage.getItem(FX_STORAGE_KEY);
    if (isFxPref(v2)) return v2;
    const legacy = localStorage.getItem(FX_STORAGE_KEY_LEGACY);
    if (legacy === "on" || legacy === "off") return legacy;
    return "auto";
  } catch {
    return "auto";
  }
}

export function writePref(pref: FxPref): void {
  try {
    localStorage.setItem(FX_STORAGE_KEY, pref);
  } catch {
    /* almacenamiento no disponible */
  }
}

/**
 * `on` es acción explícita y puede anular reduced-motion del SO.
 * Q0 (mode off por entorno) solo con Save-Data real cuando pref ≠ on.
 */
export function decide(
  pref: FxPref,
  env: { reduced: boolean; saveData: boolean },
): { mode: FxMode; reason: FxReason } {
  if (pref === "off") return { mode: "off", reason: "user-off" };
  if (env.saveData && pref !== "on") return { mode: "off", reason: "save-data" };
  if (env.reduced && pref !== "on") return { mode: "static", reason: "reduced-motion" };
  return { mode: "animated", reason: "ok" };
}

/**
 * Gobernador de tier con histéresis.
 * `tier` 1|2|3 = Q1|Q2|Q3 (mejor calidad = número mayor).
 * Baja si el frame supera 24 ms durante 2 s acumulados; sube tras 10 s estables.
 */
export class TierGovernor {
  tier: 1 | 2 | 3;
  private max: 1 | 2 | 3;
  private slow = 0;
  private fast = 0;

  constructor(start: 1 | 2 | 3, max: 1 | 2 | 3 = start) {
    this.tier = start;
    this.max = max;
  }

  frame(ms: number): void {
    if (ms > 24) {
      this.slow += ms;
      this.fast = 0;
    } else if (ms < 18) {
      this.fast += ms;
      this.slow = Math.max(0, this.slow - ms);
    }
    if (this.slow > 2000 && this.tier > 1) {
      this.tier = (this.tier - 1) as 1 | 2 | 3;
      this.slow = 0;
    }
    if (this.fast > 10000 && this.tier < this.max) {
      this.tier = (this.tier + 1) as 1 | 2 | 3;
      this.fast = 0;
    }
  }
}

/** Índice 0=Q3, 1=Q2, 2=Q1 a partir del tier del gobernador. */
export function tierToIndex(tier: 1 | 2 | 3): 0 | 1 | 2 {
  return (3 - tier) as 0 | 1 | 2;
}

export function indexToTier(index: 0 | 1 | 2): 1 | 2 | 3 {
  return (3 - index) as 1 | 2 | 3;
}

/**
 * Nivel inicial por ancho. Con ≤4 núcleos el techo es Q1 (nunca Q0).
 * Devuelve índice 0=Q3 … 2=Q1.
 */
export function initialTierIndex(width: number, cores: number): 0 | 1 | 2 {
  let index: 0 | 1 | 2 = width < 768 ? 2 : width < 1200 ? 1 : 0;
  if (cores <= 4) index = Math.max(index, 2) as 0 | 1 | 2;
  return index;
}

import { Monitor, Moon, Sparkles, Sun, Zap, ZapOff } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { setFxPreference, useFxPref, type FxPref } from "@/lib/fx";
import { requestPuff } from "@/lib/smoke/emit-bus";

const STORAGE_KEY = "vapelog-theme";

/**
 * Colores del meta `theme-color`, espejo sRGB de `--background` en claro y
 * oscuro. El test `contrast.test.ts` los acopla a los tokens: si cambia el
 * fondo, deben cambiar estos valores. Deben seguir siendo los únicos hex de
 * 6 cifras de este archivo.
 */
export const THEME_COLOR_LIGHT = "#FAF7EC";
export const THEME_COLOR_DARK = "#100D09";

type ThemePreference = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "dark", label: "Oscuro", Icon: Moon },
];

const FX_OPTIONS: Array<{ value: FxPref; label: string; Icon: typeof Sparkles }> = [
  { value: "auto", label: "Auto", Icon: Sparkles },
  { value: "on", label: "Activados", Icon: Zap },
  { value: "off", label: "Desactivados", Icon: ZapOff },
];

function isPreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  const value = localStorage.getItem(STORAGE_KEY);
  return isPreference(value) ? value : "system";
}

const preferenceListeners = new Set<() => void>();

function emitPreference() {
  preferenceListeners.forEach((listener) => listener());
}

function subscribePreference(callback: () => void): () => void {
  preferenceListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    preferenceListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function systemDarkQuery(): MediaQueryList {
  return window.matchMedia("(prefers-color-scheme: dark)");
}

function subscribeSystem(callback: () => void): () => void {
  const media = systemDarkQuery();
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const readSystem = (): boolean => systemDarkQuery().matches;
const getServerPreference = (): ThemePreference => "system";
const getServerSystem = (): boolean => false;

function effectiveOf(preference: ThemePreference, systemDark: boolean): EffectiveTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

function syncThemeColorMeta(effective: EffectiveTheme) {
  const content = effective === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  // Dos metas (media light/dark) sirven para que una siempre coincida con el
  // media del sistema; fijando AMBAS al color efectivo, la que aplique muestra
  // el color correcto en las cuatro combinaciones posibles. Este sync corre
  // en el efecto post-hidratación: el script de arranque no toca las metas
  // porque React 19 reinsertaría como duplicada cualquier <meta> hoist cuyo
  // `content` cambiara antes de la hidratación.
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", content));
}

function applyEffectiveTheme(effective: EffectiveTheme) {
  document.documentElement.classList.toggle("dark", effective === "dark");
  syncThemeColorMeta(effective);
}

function persistPreference(preference: ThemePreference) {
  localStorage.setItem(STORAGE_KEY, preference);
  applyEffectiveTheme(effectiveOf(preference, readSystem()));
  emitPreference();
}

function radioKeyNav(
  event: KeyboardEvent<HTMLDivElement>,
  length: number,
  currentIndex: number,
): number | null {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    return (currentIndex + 1) % length;
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    return (currentIndex - 1 + length) % length;
  }
  if (event.key === "Home") return 0;
  if (event.key === "End") return length - 1;
  return null;
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribePreference, readPreference, getServerPreference);
  const systemDark = useSyncExternalStore(subscribeSystem, readSystem, getServerSystem);
  const fxPref = useFxPref();
  const effective = effectiveOf(preference, systemDark);
  const themeButtonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const fxButtonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    applyEffectiveTheme(effective);
  }, [effective]);

  const handleThemeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = THEME_OPTIONS.findIndex((option) => option.value === preference);
    const nextIndex = radioKeyNav(event, THEME_OPTIONS.length, index);
    if (nextIndex === null) return;
    event.preventDefault();
    persistPreference(THEME_OPTIONS[nextIndex].value);
    themeButtonsRef.current[nextIndex]?.focus();
  };

  const handleFxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = FX_OPTIONS.findIndex((option) => option.value === fxPref);
    const nextIndex = radioKeyNav(event, FX_OPTIONS.length, index);
    if (nextIndex === null) return;
    event.preventDefault();
    const next = FX_OPTIONS[nextIndex].value;
    setFxPreference(next);
    if (next === "on" || next === "auto") {
      const box = fxButtonsRef.current[nextIndex]?.getBoundingClientRect();
      if (box) requestPuff(box.right - 8, box.top + 8);
    }
    fxButtonsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div
        role="radiogroup"
        aria-label="Tema de la interfaz"
        onKeyDown={handleThemeKeyDown}
        className="inline-flex items-center rounded-md border border-border bg-muted p-0.5"
      >
        {THEME_OPTIONS.map((option, index) => {
          const checked = preference === option.value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                themeButtonsRef.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              aria-label={option.label}
              onClick={() => persistPreference(option.value)}
              className={cn(
                "inline-flex min-h-9 items-center justify-center rounded-sm px-2.5 text-muted-foreground transition-colors duration-2 hover:text-foreground",
                checked && "bg-card text-foreground shadow-1",
              )}
            >
              <option.Icon className="size-4" aria-hidden />
            </button>
          );
        })}
      </div>
      <div
        role="radiogroup"
        aria-label="Efectos visuales"
        onKeyDown={handleFxKeyDown}
        className="inline-flex items-center rounded-md border border-border bg-muted p-0.5"
      >
        {FX_OPTIONS.map((option, index) => {
          const checked = fxPref === option.value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                fxButtonsRef.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              aria-label={option.label}
              title={option.label}
              onClick={(event) => {
                setFxPreference(option.value);
                if (option.value === "on" || option.value === "auto") {
                  const box = event.currentTarget.getBoundingClientRect();
                  requestPuff(box.right - 8, box.top + 8);
                }
              }}
              className={cn(
                "inline-flex min-h-9 items-center justify-center rounded-sm px-2.5 text-muted-foreground transition-colors duration-2 hover:text-foreground",
                checked && "bg-card text-foreground shadow-1",
              )}
            >
              <option.Icon className="size-4" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const themeBootScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((t==='system'||t===null)&&d);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

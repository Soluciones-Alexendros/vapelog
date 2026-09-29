import { Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { setFxPreference, useFx } from "@/lib/fx";

const STORAGE_KEY = "vapelog-theme";

/**
 * Colores del meta `theme-color`, espejo sRGB de `--background` en claro y
 * oscuro. El test `contrast.test.ts` los acopla a los tokens: si cambia el
 * fondo, deben cambiar estos valores. Deben seguir siendo los únicos hex de
 * 6 cifras de este archivo.
 */
export const THEME_COLOR_LIGHT = "#FCFAF6";
export const THEME_COLOR_DARK = "#100D08";

type ThemePreference = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "dark", label: "Oscuro", Icon: Moon },
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

export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribePreference, readPreference, getServerPreference);
  const systemDark = useSyncExternalStore(subscribeSystem, readSystem, getServerSystem);
  const fx = useFx();
  const effective = effectiveOf(preference, systemDark);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    applyEffectiveTheme(effective);
  }, [effective]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = THEME_OPTIONS.findIndex((option) => option.value === preference);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % THEME_OPTIONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = THEME_OPTIONS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    persistPreference(THEME_OPTIONS[nextIndex].value);
    buttonsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div
        role="radiogroup"
        aria-label="Tema de la interfaz"
        onKeyDown={handleKeyDown}
        className="inline-flex items-center rounded-md border border-border bg-muted p-0.5"
      >
        {THEME_OPTIONS.map((option, index) => {
          const checked = preference === option.value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                buttonsRef.current[index] = node;
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
      <button
        type="button"
        aria-pressed={fx === "on"}
        aria-label="Efectos"
        title="Efectos visuales"
        onClick={() => setFxPreference(fx === "on" ? "off" : "on")}
        className={cn(
          "inline-flex min-h-9 items-center justify-center rounded-md border border-border px-2.5 text-muted-foreground transition-colors duration-2 hover:text-foreground",
          fx === "on" && "bg-card text-foreground shadow-1",
        )}
      >
        <Sparkles className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export const themeBootScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((t==='system'||t===null)&&d);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

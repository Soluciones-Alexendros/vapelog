import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "vapelog-theme";

const THEME_COLORS = {
  light: "#FCFAF6",
  dark: "#100D08",
} as const;

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function syncThemeColorMeta(theme: Theme) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
  syncThemeColorMeta(theme);
}

function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getServerSnapshot = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      className="px-3"
      aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
      onClick={() => applyTheme(next)}
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  );
}

export const themeBootScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||(t!=='light'&&d);document.documentElement.classList.toggle('dark',dark);var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',dark?'${THEME_COLORS.dark}':'${THEME_COLORS.light}');}}catch(e){}})();`;

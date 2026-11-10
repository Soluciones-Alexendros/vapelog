import type { ConsoleMessage, Page } from "playwright/test";

/** Toolbar Preview de Vercel: CSP report-only; no cuenta como fallo de la app. */
export function isPreviewHostNoise(text: string): boolean {
  return (
    /vercel\.live/i.test(text) &&
    (/Content Security Policy/i.test(text) || /report-only/i.test(text) || /Framing '/i.test(text))
  );
}

function isBenignConsoleNoise(text: string): boolean {
  return /favicon|Failed to load resource/i.test(text) || isPreviewHostNoise(text);
}

export async function skipAgeGate(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem("vapelog-edad", "ok");
  });
}

export async function primeTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem("vapelog-theme", value);
    document.documentElement?.classList.toggle("dark", value === "dark");
  }, theme);
}

/** Recoge errores de consola de la aplicación (ruido acotado a favicon y vercel.live). */
export function attachAppConsoleGuard(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!isBenignConsoleNoise(text)) errors.push(text);
  });
  page.on("pageerror", (err) => {
    const text = String(err);
    if (!isBenignConsoleNoise(text)) errors.push(text);
  });
  return errors;
}

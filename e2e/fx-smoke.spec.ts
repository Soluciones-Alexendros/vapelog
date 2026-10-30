import { test, expect, type Page } from "playwright/test";

const PATHS = ["/", "/dispositivos", "/dispositivos/vaporesso-xros-4"] as const;

async function skipAgeGate(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("vapelog-edad", "ok");
  });
}

test.describe("efectos ornamentales retirados (ADR-0016)", () => {
  for (const path of PATHS) {
    test(`sin canvas de humo ni conmutador FX en ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await skipAgeGate(page);
      await page.addInitScript(() => {
        localStorage.setItem("vapelog-fx:v2", "on");
        localStorage.setItem("vapelog-fx", "on");
      });
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("canvas[data-fx='smoke-soft']")).toHaveCount(0);
      await expect(page.locator(".smoke-layer")).toHaveCount(0);
      await expect(page.getByRole("radiogroup", { name: "Efectos visuales" })).toHaveCount(0);
      await expect(page.getByRole("radiogroup", { name: "Tema de la interfaz" })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("claves FX antiguas no relanzan efectos y se borran", async ({ page }) => {
    await skipAgeGate(page);
    await page.addInitScript(() => {
      localStorage.setItem("vapelog-fx:v2", "on");
      localStorage.setItem("vapelog-fx", "on");
      localStorage.setItem("vapelog-theme", "dark");
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("canvas[data-fx]")).toHaveCount(0);
    await expect(page.locator(".kind-led")).toHaveCount(0);
    const leftovers = await page.evaluate(() => ({
      v2: localStorage.getItem("vapelog-fx:v2"),
      legacy: localStorage.getItem("vapelog-fx"),
      theme: localStorage.getItem("vapelog-theme"),
    }));
    expect(leftovers.v2).toBeNull();
    expect(leftovers.legacy).toBeNull();
    expect(leftovers.theme).toBe("dark");
  });

  test("reduced-motion no deja capas de humo", async ({ page }) => {
    await skipAgeGate(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("canvas[data-fx='smoke-soft']")).toHaveCount(0);
    await expect(page.locator('[data-fx-ready="true"]')).toHaveCount(0);
  });
});

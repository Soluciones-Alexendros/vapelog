import { test, expect } from "playwright/test";
import { attachAppConsoleGuard, skipAgeGate } from "./fixtures";

test.describe("Nicokit desde vacío (VAP-20 / U5)", () => {
  test.beforeEach(async ({ page }) => {
    await skipAgeGate(page);
  });

  test("sin parámetros en URL no muestra balance ni ejemplo silencioso", async ({ page }) => {
    const errors = attachAppConsoleGuard(page);
    await page.goto("/herramientas?tab=nicokit");
    await expect(page.getByRole("tab", { name: "Nicokit" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("heading", { name: "Balance de la mezcla" })).toHaveCount(0);
    await expect(page.getByText(/Faltan datos:/)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(/Faltan datos:/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("botella 0 muestra error accesible", async ({ page }) => {
    await page.goto("/herramientas?tab=nicokit&aroma=50&botella=0&shotMl=10&shotMg=20&shots=1");
    await expect(page.locator("#botella-error")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Balance de la mezcla" })).toHaveCount(0);
  });
});

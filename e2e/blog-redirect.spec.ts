import { test, expect, type Page } from "playwright/test";

async function skipAgeGate(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("vapelog-edad", "ok");
  });
}

test.describe("blog redirige a /archivo (ADR-0017 / U6)", () => {
  test("/blog acaba en /archivo", async ({ page }) => {
    await skipAgeGate(page);
    await page.goto("/blog");
    await expect(page).toHaveURL(/\/archivo\/?$/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("/blog/$slug desconocido también acaba en /archivo", async ({ page }) => {
    await skipAgeGate(page);
    await page.goto("/blog/ejemplo-por-que-citamos-la-fuente");
    await expect(page).toHaveURL(/\/archivo\/?$/);
  });
});

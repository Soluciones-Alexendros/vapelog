import { test, expect } from "playwright/test";
import { attachAppConsoleGuard, skipAgeGate } from "./fixtures";

test.describe("variante localizable desde CompatLab (U6)", () => {
  test.beforeEach(async ({ page }) => {
    await skipAgeGate(page);
  });

  test("enlace con hash abre la fila de variante en la ficha", async ({ page }) => {
    const errors = attachAppConsoleGuard(page);
    await page.goto("/compatibilidad?device=vaporesso-xros-4&coil=xros-corex-0-4");
    const directo = page.getByRole("button", { name: /Encaje directo/i });
    await directo.click();
    const liquidLink = page
      .getByRole("link", { name: /Heisenberg/i })
      .filter({ hasText: /20 mg\/ml/ })
      .first();
    await expect(liquidLink).toBeVisible();
    const href = await liquidLink.getAttribute("href");
    expect(href).toMatch(/heisenberg-sal-20/);
    await liquidLink.click();
    await expect(page).toHaveURL(/liquidos\/vampire-vape-heisenberg-sales#heisenberg-sal-20/);
    const variantRow = page.locator("#heisenberg-sal-20");
    await expect(variantRow).toBeVisible();
    await expect(variantRow).toContainText("20 mg/ml");
    expect(errors).toEqual([]);
  });
});

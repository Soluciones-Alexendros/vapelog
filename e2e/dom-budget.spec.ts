import { test, expect, type Page } from "playwright/test";

async function skipAgeGate(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("vapelog-edad", "ok");
  });
}

test.describe("presupuesto DOM de líquidos en ficha", () => {
  test("lista colapsada ≤ 60 li y sin fitLabel repetido en cada fila", async ({ page }) => {
    await skipAgeGate(page);
    await page.goto("/dispositivos/vaporesso-xros-4");

    const section = page.locator("#liquidos");
    await expect(section).toBeVisible();

    const panel = section.locator('[role="tabpanel"]');
    await expect(panel).toBeVisible();

    const items = panel.locator("ul li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(60);
    expect(count).toBeLessThanOrEqual(12);

    const expand = panel.getByRole("button", { name: /Ver los \d+/ });
    await expect(expand).toBeVisible();

    const firstLink = items.first().getByRole("link");
    const name = (await firstLink.innerText()).trim();
    await expect(firstLink).toHaveAccessibleName(name);
    expect(name).not.toMatch(/Encaje directo|Se puede usar|Mejor evitar/i);

    const emptyHint = page.getByText(/\d+ campos sin dato publicado/);
    if (await emptyHint.count()) {
      await expect(emptyHint.first()).toContainText("Mostrar");
    }
  });
});

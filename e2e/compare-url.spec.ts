import { expect, test } from "playwright/test";

test.describe("comparador URL", () => {
  test("enlace compartido en ventana limpia", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/comparar?dominio=device&fichas=vaporesso-xros-4,vaporesso-xros-5");
    await expect(page.getByRole("heading", { name: /Comparador/i })).toBeVisible();
    await expect(page.getByText(/XROS 4/i).first()).toBeVisible();
    await expect(page.getByText(/XROS 5/i).first()).toBeVisible();
    await expect(page).toHaveURL(/dominio=device/);
    await expect(page).toHaveURL(/vaporesso-xros-4/);
    await expect(page).toHaveURL(/vaporesso-xros-5/);
  });

  test("URL manda sobre localStorage", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
      localStorage.setItem(
        "vapelog-compare",
        JSON.stringify([{ domain: "device", slug: "vaporesso-xros-4" }]),
      );
    });
    await page.goto("/comparar?dominio=device&fichas=vaporesso-xros-5");
    await expect(page.getByText(/XROS 5/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /XROS 4/i })).toHaveCount(0);
  });

  test("quitar actualiza la URL; vaciar la limpia", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/comparar?dominio=device&fichas=vaporesso-xros-4,vaporesso-xros-5");
    // Vista y dock duplican Quitar/Vaciar; acotar al main evita strict mode.
    await page
      .getByRole("main")
      .getByRole("button", { name: /Quitar/i })
      .first()
      .click();
    await expect(page).toHaveURL(/fichas=vaporesso-xros-/);
    await page.getByRole("main").getByRole("button", { name: "Vaciar" }).click();
    await expect(page).toHaveURL(/\/comparar\/?$/);
    await expect(page).not.toHaveURL(/fichas=/);
  });

  test("añadir desde ficha no ensucia la URL de la ficha", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/dispositivos/vaporesso-xros-4");
    await page.getByRole("button", { name: "Comparar" }).click();
    await expect(page.getByRole("button", { name: "En el comparador" })).toBeVisible();
    await expect(page).toHaveURL(/\/dispositivos\/vaporesso-xros-4\/?$/);
    await expect(page).not.toHaveURL(/fichas=/);
  });
});

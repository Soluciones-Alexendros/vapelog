import { test, expect, type Page, type ConsoleMessage } from "playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    errors.push(String(err));
  });
  return errors;
}

test.describe("catálogo en Preview", () => {
  test("puerta de edad: rechazo y confirmación", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Vapelog" })).toBeVisible();
    await page.getByRole("button", { name: "No tengo 18 años" }).click();
    await expect(page.getByRole("status")).toContainText("Sin la confirmación de edad");
    await page.getByRole("button", { name: "Volver a la pregunta" }).click();
    await page.getByRole("button", { name: "Tengo 18 años o más" }).click();
    await expect(page.getByRole("heading", { name: "Vapelog" })).toBeHidden();
    await expect(page.locator("#contenido")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("ficha de dispositivo", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/dispositivos/vaporesso-xros-4");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/XROS 4/i);
    await expect(page.locator("#liquidos")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("búsqueda en /buscar", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/buscar");
    const input = page.getByPlaceholder(/Nombre, marca o cifra/i);
    await expect(input).toBeVisible();
    await input.fill("XROS");
    await page.getByRole("button", { name: "Buscar el nombre" }).click();
    await expect(page.getByRole("link").filter({ hasText: /XROS/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    expect(errors).toEqual([]);
  });

  test("comparar dos fichas", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/dispositivos/vaporesso-xros-4");
    await page.getByRole("button", { name: "Comparar" }).click();
    await expect(page.getByRole("button", { name: "En el comparador" })).toBeVisible();
    await page.goto("/dispositivos");
    const second = page.getByRole("button", { name: "Comparar" }).first();
    await expect(second).toBeVisible();
    await second.click();
    await page.goto("/comparar");
    await expect(
      page.getByRole("heading", { name: /Comparar/i }).or(page.locator("main")),
    ).toBeVisible();
    await expect(page.getByText(/XROS 4/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("nicokit en /herramientas", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("vapelog-edad", "ok");
    });
    await page.goto("/herramientas?tab=nicokit&aroma=50&botella=60&shotMl=10&shotMg=20&shots=1");
    await expect(page.getByLabel("Líquido 0 mg ya en la botella (ml)")).toHaveValue("50");
    await expect(page.getByText("3,33 mg/ml", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

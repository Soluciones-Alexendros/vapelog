import { test, expect } from "playwright/test";
import { attachAppConsoleGuard, skipAgeGate } from "./fixtures";

test.describe("calculadora Ohm — modo en URL (VAP-01)", () => {
  test.beforeEach(async ({ page }) => {
    await skipAgeGate(page);
  });

  test("formulario vacío monta modo vatios sin campo de voltaje", async ({ page }) => {
    await page.goto("/herramientas");
    const wattsBtn = page.getByRole("button", { name: "Resistencia y potencia" });
    const voltsBtn = page.getByRole("button", { name: "Resistencia y voltaje" });
    await expect(wattsBtn).toHaveAttribute("aria-pressed", "true");
    await expect(voltsBtn).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#watts")).toBeVisible();
    await expect(page.locator("#volts")).toHaveCount(0);
  });

  test("deep link legado ?volts= activa voltaje", async ({ page }) => {
    await page.goto("/herramientas?volts=3.7");
    await expect(page.getByRole("button", { name: "Resistencia y voltaje" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#volts")).toBeVisible();
    await expect(page.locator("#watts")).toHaveCount(0);
  });

  test("solo ohms abre vatios (CompatLab)", async ({ page }) => {
    await page.goto("/herramientas?tab=ohm&ohms=0.8");
    await expect(page.getByRole("button", { name: "Resistencia y potencia" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#watts")).toBeVisible();
  });

  test("cambio de modo, reset y historial atrás/adelante", async ({ page }) => {
    await page.goto("/herramientas");
    await page.getByRole("button", { name: "Resistencia y voltaje" }).click();
    await expect(page).toHaveURL(/modo=volts/);
    await expect(page.locator("#volts")).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("button", { name: "Resistencia y potencia" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.goForward();
    await expect(page.getByRole("button", { name: "Resistencia y voltaje" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Reiniciar" }).click();
    await expect(page).toHaveURL(/\/herramientas\/?(\?tab=ohm)?$/);
    await expect(page.getByRole("button", { name: "Resistencia y potencia" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#ohms")).toHaveValue("");
    await expect(page.locator("#watts")).toHaveValue("");
  });

  test("modo=watts ignora volts en cálculo si ambos en URL", async ({ page }) => {
    await page.goto("/herramientas?modo=watts&ohms=0.8&watts=14&volts=99");
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    await expect(page.locator("dl").getByText("14 W", { exact: true })).toBeVisible();
    await expect(page.getByText("99 V")).toHaveCount(0);
  });

  test("resistencia inválida muestra alerta accesible", async ({ page }) => {
    await page.goto("/herramientas?modo=watts&ohms=0&watts=14");
    await expect(page.getByRole("alert").filter({ hasText: /mayor que 0 Ω/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resultado" })).toHaveCount(0);
  });

  test("recarga conserva el modo en la URL", async ({ page }) => {
    const errors = attachAppConsoleGuard(page);
    await page.goto("/herramientas?modo=volts&ohms=1&volts=3.3");
    await expect(page.locator("#volts")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Resistencia y voltaje" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#volts")).toHaveValue("3.3");
    expect(errors).toEqual([]);
  });

  test("foco en el campo activo tras cambio de modo", async ({ page }) => {
    await page.goto("/herramientas");
    await page.getByRole("button", { name: "Resistencia y voltaje" }).click();
    await expect(page.locator("#volts")).toBeFocused();
    await page.getByRole("button", { name: "Resistencia y potencia" }).click();
    await expect(page.locator("#watts")).toBeFocused();
  });
});

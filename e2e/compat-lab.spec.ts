import { test, expect } from "playwright/test";
import { attachAppConsoleGuard, skipAgeGate } from "./fixtures";

const FIXTURES = {
  match: {
    device: "oxva-xlim-pro-2",
    coil: "xlim-0-4",
    electrical: "Coincide",
  },
  mismatch: {
    device: "vaporesso-luxe-x",
    coil: "vaporesso-gtx-0-15",
    electrical: "No coincide",
  },
  unknown: {
    device: "vaporesso-xros-4",
    coil: "xros-corex-0-4",
    electrical: "Información insuficiente",
  },
} as const;

test.describe("CompatLab — match, mismatch y unknown", () => {
  test.beforeEach(async ({ page }) => {
    await skipAgeGate(page);
  });

  for (const [kind, fx] of Object.entries(FIXTURES)) {
    test(`${kind}: eléctrico «${fx.electrical}»`, async ({ page }) => {
      const errors = attachAppConsoleGuard(page);
      await page.goto(`/compatibilidad?device=${fx.device}&coil=${fx.coil}`);
      await expect(page.getByRole("heading", { name: "Compatibilidad" })).toBeVisible();
      const electrical = page.locator("dt", { hasText: "Eléctrico" }).locator("+ dd");
      await expect(electrical).toHaveText(fx.electrical);
      expect(errors).toEqual([]);
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.goForward({ waitUntil: "domcontentloaded" });
      await expect(electrical).toHaveText(fx.electrical);
    });
  }
});

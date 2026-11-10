import { defineConfig, devices } from "playwright/test";

const port = Number(process.env.E2E_PORT ?? 4175);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

/** Matriz U9: recorridos críticos × Chromium × claro/oscuro × escritorio/móvil. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "**/ohm-mode.spec.ts",
    "**/nicokit-empty.spec.ts",
    "**/compat-lab.spec.ts",
    "**/variant-anchor.spec.ts",
    "**/compare-url.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "artifacts/playwright-matrix",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop-light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "chromium-desktop-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
    {
      name: "chromium-mobile-light",
      use: { ...devices["Pixel 7"], colorScheme: "light" },
    },
    {
      name: "chromium-mobile-dark",
      use: { ...devices["Pixel 7"], colorScheme: "dark" },
    },
  ],
});

import { defineConfig, devices } from "playwright/test";

import { previewStorageStatePath } from "./e2e/preview/storage-state";

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL) {
  throw new Error("E2E_BASE_URL es obligatorio para el suite preview");
}

// El bypass de Deployment Protection llega como cookie sembrada por
// `e2e/preview/global-setup.ts`, no como cabecera global: así el secreto no
// viaja en cada petición ni hacia terceros del contexto (toolbar `vercel.live`).
export default defineConfig({
  testDir: "./e2e/preview",
  globalSetup: "./e2e/preview/global-setup.ts",
  globalTeardown: "./e2e/preview/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    storageState: previewStorageStatePath(),
    trace: "on-first-retry",
    colorScheme: "dark",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

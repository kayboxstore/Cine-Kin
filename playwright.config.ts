import { defineConfig, devices } from "@playwright/test";

// Runs against the real built server (dist/boot.js) — the same artifact
// npm run e2e:public already exercises for public routes — never against
// the Vite dev server, so cookie/session behavior matches production.
export default defineConfig({
  testDir: "./e2e-browser",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4100",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Only set when explicitly overridden (e.g. a sandboxed dev
        // environment with a pre-installed browser at a non-standard
        // revision path) — normal environments use the browser installed
        // by `npx playwright install`.
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
});

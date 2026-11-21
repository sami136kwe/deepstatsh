import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a real local stack:
 *   npx supabase start && npm run seed:demo && npm run build && npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    locale: "fr-FR",
    // Optional: point at a preinstalled Chromium instead of `npx playwright install`.
    launchOptions: {
      args: ["--autoplay-policy=no-user-gesture-required"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
    },
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        // A fake local voice server (same contract as Kokoro) so the audio test needs no model download.
        { command: "node tests/e2e/fake-tts.mjs", url: "http://127.0.0.1:8799/health", reuseExistingServer: true },
        {
          command: "npm run start",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
          env: { KOKORO_URL: "http://127.0.0.1:8799" },
        },
      ],
});

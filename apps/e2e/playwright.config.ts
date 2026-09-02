import { defineConfig, devices } from "@playwright/test";

const web = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const api = process.env.E2E_API_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: web,
    locale: "fr-FR",
    timezoneId: "Africa/Douala",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Pixel 7"] } }],
  webServer: [
    {
      command: "pnpm --filter @tiptop/api dev",
      url: `${api}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: "../..",
    },
    {
      command: "pnpm --filter @tiptop/web dev",
      url: web,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: "../..",
    },
  ],
});

import { defineConfig, devices } from "@playwright/test";

const basePath = process.env.PLAYWRIGHT_BASE_PATH || "";
const port = process.env.PLAYWRIGHT_PORT || (basePath ? "3100" : "3000");
const baseURL = `http://localhost:${port}${basePath}/`;
const serverCommand = process.env.PLAYWRIGHT_SERVER_COMMAND || (
  process.platform === "win32"
    ? `set \"PAGES_BASE_PATH=${basePath}\"&& bunx next dev -p ${port}`
    : `PAGES_BASE_PATH=${basePath} bunx next dev -p ${port}`
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.CI || process.env.PLAYWRIGHT_SERVER_COMMAND
    ? {
        command: serverCommand,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});

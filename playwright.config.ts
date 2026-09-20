import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://localhost:${port}`;

/**
 * Anonymous, fixture-backed flows only (FW-09). Authenticated flows need a
 * non-production Supabase project and test users, which are not available
 * here (FW-03/FW-04 remain blocked); this suite must not depend on live auth.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    // Only Chromium supports granting clipboard-read/clipboard-write via
    // Playwright; Firefox/WebKit reject them as unknown permissions, so the
    // clipboard-dependent tests in adapt-copy-share.spec.ts skip on those.
    { name: "chromium", use: { ...devices["Desktop Chrome"], permissions: ["clipboard-read", "clipboard-write"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `node_modules/.bin/next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

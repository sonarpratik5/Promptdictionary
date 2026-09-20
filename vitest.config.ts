import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // tests/e2e holds Playwright specs, run via `pnpm test:e2e`, not Vitest.
    exclude: ["node_modules/**", "tests/e2e/**"],
  },
});

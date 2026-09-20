import { test, expect } from "@playwright/test";

/**
 * The local fixture mode deliberately has no writable project connection.
 * These checks ensure it remains useful while communicating that boundary
 * clearly, rather than presenting non-functional contribution controls.
 */

test("prompt details explain when community actions are unavailable", async ({ page }) => {
  await page.goto("/prompts/clear-product-brief");

  await expect(page.getByRole("heading", { name: "Help improve the library" })).toBeVisible();
  await expect(page.getByText("Community actions are unavailable right now.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save prompt" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Report prompt" })).toHaveCount(0);
});

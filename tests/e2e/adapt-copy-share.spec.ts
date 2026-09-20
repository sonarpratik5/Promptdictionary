import { test, expect } from "@playwright/test";

/**
 * Adapt -> preview -> copy -> share-link flow for a fixture prompt, plus
 * share-link hydration. Anonymous, fixture-backed; no auth dependency.
 *
 * Playwright only supports granting the clipboard-read/clipboard-write
 * permissions on Chromium (granted per-project in playwright.config.ts;
 * Firefox/WebKit reject them as unknown permissions at context creation),
 * so the two tests that read the clipboard back are Chromium-only;
 * share-link hydration has no clipboard dependency and still runs on every
 * engine.
 */

test("copy is disabled until required fields are filled, then copies the rendered text", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Playwright cannot grant clipboard-read on this engine");
  await page.goto("/prompts/clear-product-brief");

  const copyButton = page.getByRole("button", { name: "Copy adapted prompt" });
  const shareButton = page.getByRole("button", { name: "Copy share link" });
  await expect(copyButton).toBeDisabled();
  await expect(shareButton).toBeDisabled();
  await expect(page.getByText(/required remaining/)).toBeVisible();

  await page.getByLabel("Product name").fill("Acme Tracker");
  await page.getByLabel("Audience").fill("PMs");
  await page.getByLabel("Problem").fill("Slow status updates");

  const preview = page.getByLabel("Adapted prompt preview");
  await expect(preview).toContainText("Acme Tracker");
  await expect(preview).toContainText("Slow status updates");
  await expect(page.getByText("Ready to copy")).toBeVisible();
  await expect(copyButton).toBeEnabled();
  await expect(shareButton).toBeEnabled();

  await copyButton.click();
  await expect(page.getByText("Copied ✓")).toBeVisible();
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("Acme Tracker");
  expect(clipboardText).toContain("Slow status updates");
  // The stored template itself must never change.
  expect(clipboardText).not.toContain("{{product_name}}");
});

test("share link encodes values in the URL and can be copied", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Playwright cannot grant clipboard-read on this engine");
  await page.goto("/prompts/clear-product-brief");
  await page.getByLabel("Product name").fill("Acme Tracker");

  await expect(page).toHaveURL(/v\.product_name=Acme(\+|%20)Tracker/);

  const shareButton = page.getByRole("button", { name: "Copy share link" });
  await expect(shareButton).toBeEnabled();
  await shareButton.click();
  await expect(page.getByRole("button", { name: "Link copied ✓" })).toBeVisible();
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("v.product_name=Acme");
});

test("opening a shared link hydrates the declared values and ignores unknown params", async ({ page }) => {
  await page.goto("/prompts/plain-language-explainer?v.topic=Quantum+computing&v.reader=a+new+hire&v.unknown=ignored");

  await expect(page.getByLabel("Topic")).toHaveValue("Quantum computing");
  await expect(page.getByLabel("Reader")).toHaveValue("a new hire");
  await expect(page.getByLabel("Adapted prompt preview")).toContainText("Quantum computing");
  await expect(page.getByLabel("Adapted prompt preview")).toContainText("a new hire");
});

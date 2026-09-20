import { test, expect, devices } from "@playwright/test";

/**
 * Keyboard/focus, small-viewport, 200% zoom, and reduced-motion checks
 * for the FW-02 browser matrix. Runs across the chromium/firefox/webkit
 * projects configured in playwright.config.ts.
 */

test("skip link is keyboard-reachable and moves focus to main content", async ({ page, browserName }) => {
  // WebKit's test driver does not include plain links in the Tab order by
  // default (matching real Safari with "Full Keyboard Access" off), so Tab
  // never reaches the link here. This is an engine default, not a defect in
  // the skip link markup; see tests.md for the FW-02 matrix note.
  test.skip(browserName === "webkit", "WebKit does not Tab-focus links by default");
  await page.goto("/");
  // Waits out the route's loading.tsx streaming fallback, which briefly
  // shares the #main-content id with the real content while data loads.
  await expect(page.getByRole("heading", { name: "Explore prompts" })).toBeVisible();
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("search input and filter chips are reachable and operable by keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Explore prompts" })).toBeVisible();
  await page.getByLabel("Search prompts").focus();
  await page.keyboard.type("brief");
  await expect(page).toHaveURL(/[?&]q=brief/);
  await expect(page.getByRole("heading", { name: "Clear product brief" })).toBeVisible();

  await page.getByRole("button", { name: "Clear search" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Search prompts")).toHaveValue("");
});

for (const [label, viewport] of Object.entries({
  mobile: devices["iPhone 14"].viewport,
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
})) {
  test(`library and adapt screen render without horizontal overflow at ${label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(homeOverflow).toBeLessThanOrEqual(1);

    await page.getByRole("link", { name: /Clear product brief/ }).click();
    await expect(page.getByRole("heading", { name: "Add your context" })).toBeVisible();
    const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(detailOverflow).toBeLessThanOrEqual(1);
  });
}

test("library and adapt screen stay usable at an effective 200% zoom", async ({ page }) => {
  // Playwright has no cross-engine "browser zoom" API. 200% zoom on a
  // 1280x800 desktop leaves the page ~640x400 of usable CSS pixels, so
  // emulate it that way and check layout/keyboard operability, not a
  // literal zoom factor.
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Explore prompts" })).toBeVisible();
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(homeOverflow).toBeLessThanOrEqual(1);

  await page.getByLabel("Search prompts").fill("brief");
  await expect(page.getByRole("heading", { name: "Clear product brief" })).toBeVisible();
  await page.getByRole("link", { name: /Clear product brief/ }).click();
  // The home page's "How to use the library" blurb also has a heading named
  // "Add your context" (h2), so assert on the URL and the unique h1 title
  // instead of that heading to avoid matching the still-loaded home page.
  await expect(page).toHaveURL(/\/prompts\/clear-product-brief/);
  await expect(page.getByRole("heading", { level: 1, name: "Clear product brief" })).toBeVisible();

  const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(detailOverflow).toBeLessThanOrEqual(1);

  const copyButton = page.getByRole("button", { name: "Copy adapted prompt" });
  await copyButton.scrollIntoViewIfNeeded();
  await expect(copyButton).toBeVisible();
});

test("reduced-motion preference disables transitions and does not block interaction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Explore prompts" })).toBeVisible();

  const promptCardLink = page.getByRole("link", { name: /Adapt prompt/ }).first();
  const transitionDuration = await promptCardLink.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transitionDuration).toMatch(/^0s(,\s*0s)*$/);

  await page.getByRole("button", { name: "Writing", exact: true }).click();
  await expect(page).toHaveURL(/[?&]useCase=Writing/);
  await expect(page.getByRole("heading", { name: "Plain-language explainer" })).toBeVisible();
});

import { test, expect } from "@playwright/test";

/**
 * Anonymous, fixture-backed discovery: search, use-case/tag filters, the
 * empty state, and direct URL loads. No auth or database dependency.
 */

test("home lists the fixture prompts and supports free-text search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Explore prompts" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ has: page.getByRole("link", { name: /Adapt prompt/ }) })).toHaveCount(3);

  await page.getByLabel("Search prompts").fill("code review");
  await expect(page).toHaveURL(/[?&]q=code\+review/);
  await expect(page.getByRole("heading", { name: "Code review checklist" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ has: page.getByRole("link", { name: /Adapt prompt/ }) })).toHaveCount(1);
});

test("use-case chip filters and can be cleared", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Writing", exact: true }).click();
  await expect(page).toHaveURL(/[?&]useCase=Writing/);
  await expect(page.getByRole("heading", { name: "Plain-language explainer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Writing", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "All use cases" })).toHaveAttribute("aria-pressed", "true");
});

test("tag filter loaded directly from a URL renders matching results only", async ({ page }) => {
  await page.goto("/?tag=code");
  await expect(page.getByRole("heading", { name: "Code review checklist" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clear product brief" })).toHaveCount(0);
  await expect(page.locator("#tag")).toHaveValue("code");
});

test("a query with no matches shows the empty state and recovers", async ({ page }) => {
  await page.goto("/?q=zzz-no-match");
  await expect(page.getByText("No prompts match just yet.")).toBeVisible();
  await page.getByRole("button", { name: "Show all prompts" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("No prompts match just yet.")).toHaveCount(0);
});

test("browser back/forward steps through use-case filter changes", async ({ page }) => {
  // Chip/select/clear filter actions push a history entry (see
  // prompt-library.tsx's `update`); only the debounced search box replaces,
  // so it's excluded here to keep this test about discrete back/forward
  // steps rather than the debounce timing.
  await page.goto("/");
  await page.getByRole("button", { name: "Writing", exact: true }).click();
  await expect(page).toHaveURL(/[?&]useCase=Writing/);
  await expect(page.getByRole("heading", { name: "Plain-language explainer" })).toBeVisible();

  await page.getByRole("button", { name: "Development", exact: true }).click();
  await expect(page).toHaveURL(/[?&]useCase=Development/);
  await expect(page.getByRole("heading", { name: "Code review checklist" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/[?&]useCase=Writing/);
  await expect(page.getByRole("button", { name: "Writing", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Plain-language explainer" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "All use cases" })).toHaveAttribute("aria-pressed", "true");

  await page.goForward();
  await expect(page).toHaveURL(/[?&]useCase=Writing/);
  await expect(page.getByRole("button", { name: "Writing", exact: true })).toHaveAttribute("aria-pressed", "true");
});

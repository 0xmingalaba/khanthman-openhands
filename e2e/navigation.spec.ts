import { expect, test } from "@playwright/test";

test.describe("navigation (desktop)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows primary navigation and marks Home as current", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: /primary/i }).first();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /home/i })).toHaveAttribute("aria-current", "page");
  });

  test("not-yet-built product areas are disabled, not links", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: /primary/i }).first();
    const markets = nav.getByText("Markets", { exact: true });
    await expect(markets).toHaveAttribute("aria-disabled", "true");
    await expect(nav.getByRole("link", { name: /markets/i })).toHaveCount(0);
  });
});

test.describe("navigation (mobile)", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("opens the mobile menu and lists navigation items", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open navigation menu/i }).click();
    const nav = page.getByRole("navigation", { name: /primary/i }).first();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /home/i })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("routing", () => {
  test("unknown route renders the not-found state", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  });
});

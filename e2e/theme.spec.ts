import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("theme switching", () => {
  test("toggles to dark and persists across reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: /theme/i }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

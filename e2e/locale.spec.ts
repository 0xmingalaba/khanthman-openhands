import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("locale switching", () => {
  test("switches the interface to Burmese and persists across reload", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("locale-my").click();

    await expect(page.locator("html")).toHaveAttribute("lang", "my");
    await expect(page.getByText("ခန့်မှန်း ဈေးကွက်").first()).toBeVisible();

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "my");
  });

  test("switches back to English", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("locale-my").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "my");

    await page.getByTestId("locale-en").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

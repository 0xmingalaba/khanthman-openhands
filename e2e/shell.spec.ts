import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("application shell", () => {
  test("renders the header, disclosure banner, main and footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByText(/Virtual credits only/i).first()).toBeVisible();
  });

  test("exposes a skip-to-content link", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: /skip to main content/i });
    await expect(skip).toBeAttached();
  });

  test("shows the English app name by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Khant Hman Prediction Market").first()).toBeVisible();
  });

  test("shows an honest empty state instead of fabricated market cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /no markets yet/i })).toBeVisible();
  });
});

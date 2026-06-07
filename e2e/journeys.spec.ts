import { test, expect } from "@playwright/test";

test.describe("Sales Invoices", () => {
  test("invoice list page loads", async ({ page }) => {
    await page.goto("/ar/login");
    await page.getByLabel(/البريد الإلكتروني/i).fill("admin@test.com");
    await page.getByLabel(/كلمة المرور/i).fill("password123");
    await page.getByRole("button", { name: /تسجيل الدخول/i }).click();
    await page.waitForURL("**/dashboard");
    await page.goto("/ar/sales/invoices");
    await expect(page.getByText(/الفواتير/i).first()).toBeVisible();
  });
});

test.describe("Language Switch", () => {
  test("switches between Arabic and English", async ({ page }) => {
    await page.goto("/ar/login");
    const enLink = page.locator('a[href="/en/login"]').first();
    if (await enLink.isVisible()) {
      await enLink.click();
      await page.waitForURL("**/en/login");
      await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    }
  });
});

test.describe("404 Handling", () => {
  test("shows 404 for unknown routes", async ({ page }) => {
    await page.goto("/en/some-nonexistent-page");
    await expect(page.locator("text=404").or(page.locator("text=not found")).first()).toBeVisible();
  });
});

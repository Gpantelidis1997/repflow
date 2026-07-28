import { expect, test } from '@playwright/test';

test('public pages have one main heading and keyboard-visible actions', async ({ page }) => {
  for (const route of ['/', '/pricing', '/login', '/signup']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  }
});

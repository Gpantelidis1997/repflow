import { expect, test } from '@playwright/test';

const protectedRoutes = [
  '/app/page',
  '/app/program',
  '/app/workout',
  '/app/progress',
  '/app/profile',
  '/app/billing'
];

test('anonymous users cannot open protected application routes', async ({ page }) => {
  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login|\/signup/);
  }
});

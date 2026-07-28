import { expect, test } from '@playwright/test';

test.describe('public release smoke', () => {
  test('landing page exposes primary actions', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RepFlow/i);
    await expect(page.getByRole('link', { name: /get started|start|sign up/i }).first()).toBeVisible();
  });

  test('legal and pricing pages are reachable', async ({ page }) => {
    for (const route of ['/pricing', '/privacy', '/terms']) {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('health endpoint reports service status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.status).toBe('ok');
    expect(payload.service).toBe('repflow');
  });
});

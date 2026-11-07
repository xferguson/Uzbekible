import { expect, test } from '@playwright/test';

test('home page loads with the Uzbekible title', async ({ page }) => {
  await page.goto('/Uzbekible/');
  await expect(page).toHaveTitle('Uzbekible');
  await expect(page.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeVisible();
});

test('test hooks are exposed in the e2e build', async ({ page }) => {
  await page.goto('/Uzbekible/?seed=42&clock=fake');
  const hooks = await page.evaluate(() => window.__uzbekibleTest);
  expect(hooks).toEqual({ seed: 42, fakeClock: true });
});

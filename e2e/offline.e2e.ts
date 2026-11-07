import { expect, test } from '@playwright/test';

test('after first load, an offline reload still renders the home screen', async ({
  page,
  context,
}) => {
  await page.goto('/Uzbekible/');
  await expect(page.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeVisible();

  // Wait until the service worker is active and controlling this page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeVisible();
});

test('serves a web app manifest with the Uzbekible identity', async ({ page, request }) => {
  await page.goto('/Uzbekible/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href!, page.url()).toString());
  const manifest = await res.json();
  expect(manifest.name).toBe('Uzbekible');
  expect(manifest.short_name).toBe('Uzbekible');
  expect(manifest.theme_color).toBe('#1B3F8F');
  expect(manifest.background_color).toBe('#F7F4EC');
});

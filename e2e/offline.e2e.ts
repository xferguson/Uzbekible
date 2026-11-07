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

test('serves every manifest icon, the favicon and the apple-touch-icon', async ({
  page,
  request,
}) => {
  await page.goto('/Uzbekible/');
  const manifestUrl = new URL(
    (await page.locator('link[rel="manifest"]').getAttribute('href'))!,
    page.url(),
  );
  const manifest = await (await request.get(manifestUrl.toString())).json();
  const icons: { src: string; purpose: string }[] = manifest.icons;
  expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
  const hrefs = [
    ...icons.map((i) => new URL(i.src, manifestUrl).toString()),
    ...(await page
      .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLLinkElement).href))),
  ];
  expect(hrefs.length).toBe(12);
  for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
});

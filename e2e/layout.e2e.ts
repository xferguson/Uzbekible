import { expect, test, type Page } from '@playwright/test';

// Narrow Android phone (e.g. Galaxy A-series in Brave/Chrome): 360 CSS px wide.
test.use({
  viewport: { width: 360, height: 780 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

const HOME = '/Uzbekible/';

/** No element may push the page wider than the viewport. */
async function expectNoHorizontalOverflow(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
}

/** Every element matching `selector` lies fully inside the viewport horizontally. */
async function expectInsideViewport(page: Page, selector: string) {
  const outside = await page.locator(selector).evaluateAll((els) =>
    els
      .map((e) => ({ text: e.textContent ?? '', r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.left < 0 || r.right > window.innerWidth + 0.5)
      .map(({ text }) => text),
  );
  expect(outside).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto(HOME);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Juft' })).toBeVisible();
});

test('home: game picker is styled, not a bare browser button', async ({ page }) => {
  await expectNoHorizontalOverflow(page);
  const juft = page.getByRole('button', { name: 'Juft' });
  const box = await juft.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  const bg = await juft.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).not.toBe('rgb(239, 239, 239)'); // Chromium's default ButtonFace (light)
  expect(bg).not.toBe('rgb(107, 107, 107)'); // Chromium's default ButtonFace (dark)
});

test('map: building names are not clipped and nothing overflows', async ({ page }) => {
  await page.getByRole('button', { name: 'Juft' }).click();
  await expect(page.getByRole('button', { name: '1-daraja, joriy' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const clipped = await page
    .locator('nav[aria-label="Binolar"] button')
    .evaluateAll((els) =>
      els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
    );
  expect(clipped).toEqual([]);
  await expectInsideViewport(page, 'section[aria-label="Daraja xaritasi"] ol button');
});

test('results: the card and its buttons fit on a phone', async ({ page }) => {
  await page.getByRole('button', { name: 'Juft' }).click();
  await page.getByRole('button', { name: '1-daraja, joriy' }).click();
  await expect(page.getByTestId('col-left')).toBeVisible({ timeout: 10_000 });
  const ids = await page
    .locator('[data-testid="col-left"] [data-tile-id]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-tile-id')!));
  for (const id of ids) {
    await page.locator(`[data-testid="col-left"] [data-tile-id="${id}"] button`).click();
    await page.locator(`[data-testid="col-right"] [data-tile-id="${id}"] button`).click();
  }
  await expect(page.getByRole('heading', { name: 'Tabriklaymiz!' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectInsideViewport(page, 'h2, dt, dd, button');
});

test('a way out stays visible on every screen, even over the pause overlay', async ({ page }) => {
  await page.getByRole('button', { name: 'Juft' }).click();
  await expect(page.getByRole('button', { name: 'Orqaga' })).toBeVisible();
  await page.getByRole('button', { name: '1-daraja, joriy' }).click();
  await expect(page.getByTestId('col-left')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Pauza' }).click();
  await page.getByRole('button', { name: 'Bosh sahifa' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeVisible();
});

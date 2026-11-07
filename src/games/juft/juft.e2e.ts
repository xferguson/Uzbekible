import { expect, test, type Page } from '@playwright/test';

const HOME = '/Uzbekible/';
const PROGRESS_KEY = 'uzbekible:v1:progress:juft';
const SETTINGS_KEY = 'uzbekible:v1:settings';

type Progress = {
  unlocked: number;
  best: Record<number, { score: number; stars: number; timeMs: number }>;
};

const readProgress = (page: Page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Progress) : null;
  }, PROGRESS_KEY);

/** Writes a storage value, then reloads so the app starts from it. */
async function seed(page: Page, key: string, value: unknown) {
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, JSON.stringify(v)),
    [key, value],
  );
  await page.reload();
}

async function openMap(page: Page) {
  await page.getByRole('button', { name: /^(Juft|Жуфт)$/ }).click();
}

async function startLevel(page: Page, level: number) {
  await page.getByRole('button', { name: new RegExp(`^${level}-(daraja|дараjа|даража)`) }).click();
  // Real 3-2-1 countdown, then the board.
  await expect(page.getByTestId('col-left')).toBeVisible({ timeout: 10_000 });
}

const tileIds = (page: Page, side: 'left' | 'right') =>
  page
    .locator(`[data-testid="col-${side}"] [data-tile-id]`)
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-tile-id')!));

const tile = (page: Page, side: 'left' | 'right', id: string) =>
  page.locator(`[data-testid="col-${side}"] [data-tile-id="${id}"] button`);

/** Matches every pair on the board (tile ids are shared by both columns). */
async function clearBoard(page: Page) {
  for (const id of await tileIds(page, 'left')) {
    await tile(page, 'left', id).click();
    await tile(page, 'right', id).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(HOME);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Juft' })).toBeVisible();
});

test('complete: level 1 clears, shows results, unlocks level 2 and survives a reload', async ({
  page,
}) => {
  await openMap(page);
  await startLevel(page, 1);
  await clearBoard(page);

  await expect(page.getByRole('heading', { name: 'Tabriklaymiz!' })).toBeVisible();
  await expect(page.getByRole('img', { name: /\/3$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keyingi' })).toBeVisible();

  const progress = await readProgress(page);
  expect(progress?.unlocked).toBe(2);
  expect(progress?.best[1]?.score).toBeGreaterThan(0);

  await page.reload();
  await openMap(page);
  await expect(page.getByRole('button', { name: /^1-daraja, \d yulduz/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '2-daraja, joriy' })).toBeVisible();
  expect((await readProgress(page))?.unlocked).toBe(2);
});

test('fail: three mistakes lose the level and "Qayta urinish" restarts it', async ({ page }) => {
  await page.goto(HOME);
  await seed(page, PROGRESS_KEY, { unlocked: 16, best: {} });
  await openMap(page);
  await startLevel(page, 16);

  const ids = await tileIds(page, 'left');
  expect(ids.length).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < 3; i++) {
    await tile(page, 'left', ids[0]!).click();
    await tile(page, 'right', ids[1]!).click();
    // The wrong pair flashes, then the selection clears.
    // (The third mistake ends the level, so there is nothing left to check then.)
    if (i < 2) await expect(tile(page, 'left', ids[0]!)).toHaveAttribute('aria-pressed', 'false');
  }

  await expect(page.getByRole('heading', { name: 'Yutqazdingiz' })).toBeVisible();
  expect((await readProgress(page))?.best[16]).toBeUndefined();

  await page.getByRole('button', { name: 'Qayta urinish' }).click();
  await expect(page.getByTestId('col-left')).toBeVisible({ timeout: 10_000 });
  expect(await tileIds(page, 'left')).toHaveLength(ids.length);
});

test('replay: the best score only changes when it is beaten', async ({ page }) => {
  await page.goto(HOME);
  // Level 1 already has an unbeatable best, so a replay must leave it alone.
  const unbeatable = { score: 1_000_000, stars: 3, timeMs: 1_000 };
  await seed(page, PROGRESS_KEY, { unlocked: 2, best: { 1: unbeatable } });
  await openMap(page);
  await startLevel(page, 1);
  await clearBoard(page);
  await expect(page.getByRole('heading', { name: 'Tabriklaymiz!' })).toBeVisible();
  await expect(page.getByText('Yangi rekord!')).toHaveCount(0);
  expect((await readProgress(page))?.best[1]).toEqual(unbeatable);

  // A trivial best is beaten by any real clear, and the record is updated.
  await seed(page, PROGRESS_KEY, { unlocked: 2, best: { 1: { score: 1, stars: 1, timeMs: 1 } } });
  await openMap(page);
  await startLevel(page, 1);
  await clearBoard(page);
  await expect(page.getByText('Yangi rekord!')).toBeVisible();
  const best = (await readProgress(page))?.best[1];
  expect(best?.score).toBeGreaterThan(1);
  expect(best?.stars).toBeGreaterThanOrEqual(1);
});

test('settings: Cyrillic changes the board script and a disabled source language disappears', async ({
  page,
}) => {
  // Cyrillic.
  await page.getByRole('button', { name: 'Sozlamalar' }).click();
  await page.getByRole('radio', { name: /^Kirill/ }).check();
  await expect(
    page.getByRole('heading', { name: 'Созламалар' }).or(page.locator('h2')),
  ).toBeVisible();
  await page.getByRole('button', { name: /^(Orqaga|Орқага)$/ }).click();
  await expect(page.getByRole('button', { name: 'Жуфт' })).toBeVisible();
  await page.getByRole('button', { name: 'Жуфт' }).click();
  await page.getByRole('button', { name: /^1-/ }).first().click();
  await expect(page.getByTestId('col-right')).toBeVisible({ timeout: 10_000 });
  const uz = await page.getByTestId('col-right').innerText();
  expect(uz).toMatch(/[Ѐ-ӿ]/);
  expect(uz).not.toMatch(/[A-Za-z]/);

  // Switch back to Latin, then drop Turkish on a mixed-language level.
  await seed(page, PROGRESS_KEY, { unlocked: 20, best: {} });
  await seed(page, SETTINGS_KEY, {
    languages: ['ru', 'fa', 'ar'],
    script: 'uz-Latn',
    theme: 'system',
  });
  await page.getByRole('button', { name: 'Juft' }).click();
  await startLevel(page, 20);
  await expect(page.getByTestId('lang-badge').first()).toBeVisible();
  await expect(page.locator('[data-testid="col-left"] [lang="tr"]')).toHaveCount(0);

  // And the toggle itself works through the UI: Turkish only.
  await page.reload();
  await page.getByRole('button', { name: 'Sozlamalar' }).click();
  await page.getByRole('checkbox', { name: 'Türkçe' }).check();
  for (const name of ['Русский', 'فارسی', 'العربية'])
    await page.getByRole('checkbox', { name }).uncheck();
  await page.getByRole('button', { name: 'Orqaga' }).click();
  await page.getByRole('button', { name: 'Juft' }).click();
  await startLevel(page, 20);
  await expect(
    page.locator(
      '[data-testid="col-left"] [lang="ru"], [data-testid="col-left"] [lang="fa"], [data-testid="col-left"] [lang="ar"]',
    ),
  ).toHaveCount(0);
});

test('offline: after the first load a reload still plays a level', async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // Warm the content pack into the cache before going offline.
  await openMap(page);
  await startLevel(page, 1);

  await context.setOffline(true);
  await page.reload();
  await openMap(page);
  await startLevel(page, 1);
  await clearBoard(page);
  await expect(page.getByRole('heading', { name: 'Tabriklaymiz!' })).toBeVisible();
});

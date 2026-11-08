import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const HOME = '/Uzbekible/';
const BEST_KEY = 'uzbekible:v1:best:soxta';
const SETTINGS_KEY = 'uzbekible:v1:settings';
const LOG_KEY = 'uzbekible:v1:learning-log';

interface PackItem {
  uz: { latn: string };
  glossEn: string;
  sources: { lang: string; text: string; glossEn?: string }[];
}
const PACK = JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')) as {
  items: PackItem[];
};

type Side = 'left' | 'right';
const opposite = (s: Side): Side => (s === 'left' ? 'right' : 'left');

async function seed(page: Page, key: string, value: unknown) {
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, JSON.stringify(v)),
    [key, value],
  );
  await page.reload();
}

const read = <T>(page: Page, key: string) =>
  page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  }, key);

async function start(page: Page) {
  await page.getByRole('button', { name: /^(Soxta|Сохта)$/ }).click();
  await page.getByRole('button', { name: /Boshlash|Бошлаш/ }).click();
  // Real 3-2-1 countdown, then the card.
  await expect(page.getByTestId('soxta-board')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('clue')).toBeVisible();
}

/** Which side the clue belongs to, worked out from the Uzbek word on screen and the pack. */
async function rightSide(page: Page): Promise<Side> {
  const clue = (await page.getByTestId('clue').innerText()).trim();
  const tiles = await Promise.all(
    (['left', 'right'] as const).map(async (side) => ({
      side,
      lines: (await page.getByTestId(`tile-${side}`).innerText()).split('\n').map((l) => l.trim()),
    })),
  );
  const uz = tiles.find((t) => t.lines[0] === 'UZ')!;
  const word = uz.lines.at(-1)!;
  const item = PACK.items.find((i) => i.uz.latn === word);
  if (!item) throw new Error(`no pack item for "${word}"`);
  return item.glossEn === clue ? uz.side : opposite(uz.side);
}

async function answer(page: Page, side: Side) {
  await page.getByRole('button', { name: side === 'left' ? 'Chap' : 'Oʻng' }).click();
}

/** Skips the reveal so the next card (or the results) is not waited for. */
const skipReveal = async (page: Page) => {
  await page.getByTestId('reveal').click();
};

async function loseThree(page: Page) {
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole('button', { name: 'Chap' })).toBeVisible();
    await answer(page, opposite(await rightSide(page)));
    await expect(page.getByTestId('reveal')).toHaveAttribute('data-kind', 'wrong');
    if (i < 2) await skipReveal(page);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(HOME);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Soxta' })).toBeVisible();
});

test('a run: one right answer, three mistakes, results, best saved, replay', async ({ page }) => {
  await seed(page, SETTINGS_KEY, { languages: ['tr'], script: 'uz-Latn', theme: 'system' });
  await start(page);

  await answer(page, await rightSide(page));
  await expect(page.getByTestId('reveal')).toHaveAttribute('data-kind', 'correct');
  await skipReveal(page);

  await loseThree(page);

  await expect(page.getByRole('heading', { name: 'Barakalla!' })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Yangi rekord!')).toBeVisible();
  await expect(page.getByText('points · was 0')).toBeVisible();
  // The missed pairs are listed with both meanings.
  await expect(page.getByRole('listitem').first()).toContainText(' = ');
  expect(await read(page, BEST_KEY)).toEqual({ score: 100, streak: 1 });

  // Every answer is in the learning log with the item and the outcome.
  const log = (await read<{ events: { type: string; itemId?: string }[] }>(page, LOG_KEY))!.events;
  expect(log.filter((e) => e.type === 'swipe_correct')).toHaveLength(1);
  expect(log.filter((e) => e.type === 'swipe_wrong')).toHaveLength(3);
  expect(log.filter((e) => e.type.startsWith('swipe_')).every((e) => e.itemId)).toBe(true);

  // The best survives a reload and shows on the ready card; Again starts a fresh run.
  await page.reload();
  expect(await read(page, BEST_KEY)).toEqual({ score: 100, streak: 1 });
  await page.getByRole('button', { name: 'Soxta' }).click();
  await expect(page.getByText('Best score').locator('..')).toContainText('100');
  await page.getByRole('button', { name: 'Orqaga' }).click();
  await start(page);
  await loseThree(page);
  await expect(page.getByRole('heading', { name: 'Yaxshi!' })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Yangi rekord!')).toHaveCount(0);
  await expect(page.getByText('points · best 100')).toBeVisible();
  await page.getByRole('button', { name: /Yana/ }).click();
  await expect(page.getByTestId('soxta-board')).toBeVisible();
});

test('script toggle on the ready card shows the Uzbek word in Cyrillic', async ({ page }) => {
  await page.getByRole('button', { name: 'Soxta' }).click();
  await page.getByRole('radio', { name: /Cyrillic/ }).click();
  await expect(page.getByTestId('ready-sample')).toContainText('тун');
  await page.getByRole('button', { name: /Бошлаш/ }).click();
  await expect(page.getByTestId('soxta-board')).toBeVisible({ timeout: 10_000 });
  const uz = (await page.getByTestId('tile-left').innerText()).startsWith('UZ') ? 'left' : 'right';
  await expect(page.getByTestId(`tile-${uz}`)).toContainText(/[\u0400-\u04FF]/);
});

test('offline: after the first load a reload still plays a card', async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await start(page);
  await answer(page, await rightSide(page));
  await expect(page.getByTestId('reveal')).toHaveAttribute('data-kind', 'correct');
});

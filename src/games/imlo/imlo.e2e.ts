import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { toLetters, sourceLetters } from '../../core/text/index.ts';

const HOME = '/Uzbekible/';
const PROGRESS_KEY = (mode: string) => `uzbekible:v1:progress:imlo:${mode}`;
const SETTINGS_KEY = 'uzbekible:v1:settings';
const MODE_KEY = 'uzbekible:v1:modes';

interface PackItem {
  uz: { latn: string; cyrl: string };
  glossEn: string;
  sources: { lang: string; text: string }[];
}
const PACK = JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')) as {
  items: PackItem[];
};

type Progress = { unlocked: number; best: Record<number, { score: number; stars: number }> };
const readProgress = (page: Page, mode = 'oson') =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Progress) : null;
  }, PROGRESS_KEY(mode));

const readLog = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem('uzbekible:v1:learning-log');
    return raw ? (JSON.parse(raw) as { events: Record<string, unknown>[] }).events : [];
  });

async function seed(page: Page, key: string, value: unknown) {
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, JSON.stringify(v)),
    [key, value],
  );
  await page.reload();
}

/** Turkish only keeps the answer lookup simple: the source word is always a Turkish form. */
const TR_LATN = { languages: ['tr'], script: 'uz-Latn', theme: 'system' };
const TR_CYRL = { languages: ['tr'], script: 'uz-Cyrl', theme: 'system' };

async function openMap(page: Page) {
  await page.getByRole('button', { name: /^(Imlo|Имло)$/ }).click();
}

async function startLevel(page: Page, level: number) {
  await page.getByRole('button', { name: new RegExp(`^${level}-(daraja|дараjа|даража)`) }).click();
  await expect(page.getByTestId('imlo-board')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('clue')).toBeVisible();
}

const bankLetters = (page: Page) =>
  page
    .locator('[data-testid="bank-cell"] button')
    .evaluateAll((els) =>
      els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()),
    );

const tileButton = (page: Page, letter: string): Locator =>
  page.getByTestId('bank').getByRole('button', { name: letter, exact: true }).first();

/** The answer for the pair on screen: the item whose clue matches and whose letters fit the bank. */
async function answerFor(page: Page, script: 'latn' | 'cyrl') {
  const clue = (await page.getByTestId('clue').innerText()).trim();
  const bank = await bankLetters(page);
  const fits = (need: string[]) => {
    const have = [...bank];
    for (const l of need) {
      const i = have.indexOf(l);
      if (i < 0) return false;
      have.splice(i, 1);
    }
    return true;
  };
  for (const item of PACK.items) {
    if (item.glossEn !== clue) continue;
    const uz = toLetters(
      script === 'cyrl' ? item.uz.cyrl : item.uz.latn,
      script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn',
    );
    for (const s of item.sources.filter((x) => x.lang === 'tr')) {
      const src = sourceLetters(s.text, 'tr');
      if (fits([...src, ...uz])) return { src, uz };
    }
  }
  throw new Error(`no item fits clue "${clue}" and bank ${bank.join(',')}`);
}

async function spell(page: Page, side: 'source' | 'uz', letters: string[]) {
  await page.getByTestId(`row-${side}`).click({ position: { x: 2, y: 2 } });
  for (const l of letters) await tileButton(page, l).click();
}

/** Spells the pair on screen correctly and checks it. */
async function solvePair(page: Page, script: 'latn' | 'cyrl') {
  const { src, uz } = await answerFor(page, script);
  await spell(page, 'source', src);
  await spell(page, 'uz', uz);
  await page.getByRole('button', { name: /^(Tekshir|Текшир)/ }).click();
}

async function solveLevel(page: Page, script: 'latn' | 'cyrl' = 'latn') {
  const dots = await page.getByTestId('progress-dot').count();
  for (let i = 0; i < dots; i++) {
    await solvePair(page, script);
    if (i < dots - 1)
      await expect(page.getByTestId('progress-dot').nth(i + 1)).toHaveAttribute(
        'data-state',
        'current',
      );
  }
}

/** Fills every slot with whatever is left in the bank, so the check is wrong. */
async function fillWrong(page: Page) {
  const slots = await page.getByTestId('slot').count();
  const sourceSlots = await page.getByTestId('row-source').getByTestId('slot').count();
  const row = async (side: 'source' | 'uz', n: number) => {
    await page.getByTestId(`row-${side}`).click({ position: { x: 2, y: 2 } });
    for (let i = 0; i < n; i++)
      await page.locator('[data-testid="bank-cell"] button').last().click();
  };
  await row('source', sourceSlots);
  await row('uz', slots - sourceSlots);
}

test.beforeEach(async ({ page }) => {
  await page.goto(HOME);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Imlo' })).toBeVisible();
});

test('home lists Imlo next to Juft and the map offers Oson, Oʻrta and Qiyin', async ({ page }) => {
  const names = await page.locator('nav button').allInnerTexts();
  expect(names.slice(0, 2)).toEqual(['Juft', 'Imlo']);
  await openMap(page);
  for (const mode of ['Oson', 'Oʻrta', 'Qiyin'])
    await expect(page.getByRole('radio', { name: mode })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Oson' })).toBeChecked();
});

test('complete: level 1 in Oson spells every pair, shows results with stars and unlocks level 2', async ({
  page,
}) => {
  await seed(page, SETTINGS_KEY, TR_LATN);
  await openMap(page);
  await startLevel(page, 1);
  await solveLevel(page);

  await expect(page.getByRole('heading', { name: 'Tabriklaymiz!' })).toBeVisible();
  await expect(page.getByRole('img', { name: /\/3$/ })).toBeVisible();
  const progress = await readProgress(page);
  expect(progress?.unlocked).toBe(2);
  expect(progress?.best[1]?.score).toBeGreaterThan(0);

  const events = await readLog(page);
  const types = events.map((e) => e.type);
  expect(types).toContain('level_start');
  expect(types).toContain('spell_correct');
  expect(types.at(-1)).toBe('level_complete');
  expect(events.filter((e) => e.type === 'spell_correct').every((e) => e.gameId === 'imlo')).toBe(
    true,
  );

  await page.reload();
  await openMap(page);
  await expect(page.getByRole('button', { name: /^1-daraja, \d yulduz/ })).toBeVisible();
});

test('fail: three wrong checks lose the level, log what was given, and retry restarts it', async ({
  page,
}) => {
  await seed(page, SETTINGS_KEY, TR_LATN);
  await openMap(page);
  await startLevel(page, 1);

  for (let i = 0; i < 3; i++) {
    await fillWrong(page);
    await page.getByRole('button', { name: /^(Tekshir|Текшир)/ }).click();
    // A wrong row keeps its letters; clear them so the next try is a fresh wrong check.
    if (i < 2) {
      await expect(page.getByTestId('crack').first()).toBeVisible();
      await page.getByTestId('row-source').click({ position: { x: 2, y: 2 } });
      for (let k = 0; k < 20; k++) await page.keyboard.press('Backspace');
    }
  }
  await expect(page.getByRole('heading', { name: 'Yutqazdingiz' })).toBeVisible();
  expect((await readProgress(page))?.best[1]).toBeUndefined();

  const wrong = (await readLog(page)).filter((e) => e.type === 'spell_wrong');
  expect(wrong.length).toBeGreaterThanOrEqual(3);
  expect(wrong[0]).toMatchObject({ gameId: 'imlo', side: expect.stringMatching(/^(source|uz)$/) });
  expect(typeof wrong[0]!.given).toBe('string');
  expect(typeof wrong[0]!.expected).toBe('string');
  expect((await readLog(page)).at(-1)?.type).toBe('level_failed');

  await page.getByRole('button', { name: 'Qayta urinish' }).click();
  await expect(page.getByTestId('imlo-board')).toBeVisible({ timeout: 10_000 });
});

test('mode: switching to Qiyin keeps its own progress and adds extra tiles', async ({ page }) => {
  await seed(page, SETTINGS_KEY, TR_LATN);
  await openMap(page);
  await startLevel(page, 1);
  const oson = (await bankLetters(page)).length;
  await page
    .getByRole('button', { name: /orqaga|Orqaga/i })
    .first()
    .click();

  await page.getByRole('radio', { name: 'Qiyin' }).check();
  expect(await page.evaluate((k) => localStorage.getItem(k), MODE_KEY)).toContain('qiyin');
  await expect(
    page
      .getByRole('button', { name: '2-daraja, qulfli' })
      .or(page.getByRole('button', { name: /^2-daraja/ })),
  ).toBeVisible();
  await startLevel(page, 1);
  expect((await bankLetters(page)).length).toBeGreaterThan(oson);
  expect(await readProgress(page, 'qiyin')).toBeNull();
});

test('settings: Cyrillic puts the Uzbek tiles in Cyrillic and the level still completes', async ({
  page,
}) => {
  await seed(page, SETTINGS_KEY, TR_CYRL);
  await expect(page.getByRole('button', { name: 'Имло' })).toBeVisible();
  await openMap(page);
  await startLevel(page, 1);
  const uzRow = await page.getByTestId('bank').innerText();
  expect(uzRow).toMatch(/[Ѐ-ӿ]/);
  await solveLevel(page, 'cyrl');
  await expect(page.getByRole('heading', { name: /Табриклаймиз!|Tabriklaymiz!/ })).toBeVisible();
});

test('offline: after the first load a reload still plays a level', async ({ page, context }) => {
  await seed(page, SETTINGS_KEY, TR_LATN);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await openMap(page);
  await startLevel(page, 1);

  await context.setOffline(true);
  await page.reload();
  await openMap(page);
  await startLevel(page, 1);
  await solveLevel(page);
  await expect(page.getByRole('heading', { name: 'Tabriklaymiz!' })).toBeVisible();
});

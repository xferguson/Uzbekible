/** Imlo screens (docs/games/06-imlo.md, I4 frames). Imlo-only moves live here; shell moves come from the driver. */
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { sourceLetters, toLetters } from '../../src/core/text/index.ts';
import type { Driver, ScreenState } from '../shots/types.ts';

const TITLE = 'Imlo';
/** Wrong-row crack in the board (Board.tsx WRONG_MS) plus a margin. */
const AFTER_WRONG_MS = 600;
/** Correct-check glaze in the board (Board.tsx RIGHT_MS) plus a margin. */
const RIGHT_MS = 700;

const progress = (unlocked: number, cleared = 0) => ({
  'imlo:oson': {
    unlocked,
    best: Object.fromEntries(
      Array.from({ length: cleared }, (_, i) => [
        i + 1,
        { score: 900, stars: (i % 3) + 1, timeMs: 9000 },
      ]),
    ),
  },
});

const bank = (page: Page) => page.locator('[data-testid="bank-cell"] button');

/** Fills one row with whatever the bank offers (letters are irrelevant to the screen). */
async function fillRow(d: Driver, side: 'source' | 'uz') {
  const row = d.page.getByTestId(`row-${side}`);
  await row.click({ position: { x: 2, y: 2 } });
  const n = await row.getByTestId('slot').count();
  for (let i = 0; i < n; i++) await bank(d.page).last().click();
}

async function board(d: Driver, level = 1, mode?: string) {
  await d.open({ progress: progress(level), settings: { languages: ['tr'] } });
  await d.openGame(TITLE);
  if (mode) await d.page.getByRole('radio', { name: mode }).check();
  await d.startLevel(level);
  const shown = await d.page.getByTestId('imlo-board').count();
  d.check(shown === 1, 'expected the Imlo board');
}

interface PackItem {
  uz: { latn: string };
  glossEn: string;
  sources: { lang: string; text: string }[];
}
const PACK = JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')) as {
  items: PackItem[];
};

/** The correct letters for the pair on screen: found by its clue and what the bank can build. */
async function answer(d: Driver) {
  const clue = (await d.page.getByTestId('clue').innerText()).trim();
  const bank = await d.page
    .locator('[data-testid="bank-cell"] button')
    .evaluateAll((els) =>
      els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()),
    );
  const fits = (need: string[]) => {
    const have = [...bank];
    return need.every((l) => {
      const i = have.indexOf(l);
      if (i < 0) return false;
      have.splice(i, 1);
      return true;
    });
  };
  for (const item of PACK.items) {
    if (item.glossEn !== clue) continue;
    const uz = toLetters(item.uz.latn, 'uz-Latn');
    for (const s of item.sources.filter((x) => x.lang === 'tr')) {
      const src = sourceLetters(s.text, 'tr');
      if (fits([...src, ...uz])) return { src, uz };
    }
  }
  d.check(false, `no Turkish spelling found for clue "${clue}"`);
  throw new Error('unreachable');
}

async function spell(d: Driver, side: 'source' | 'uz', letters: string[]) {
  await d.page.getByTestId(`row-${side}`).click({ position: { x: 2, y: 2 } });
  for (const l of letters)
    await d.page.getByTestId('bank').getByRole('button', { name: l, exact: true }).first().click();
}

/** Solves `n` pairs correctly, so the progress dots show `n` done. Needs Turkish as the only source language. */
async function solvePairs(d: Driver, n: number) {
  for (let i = 0; i < n; i++) {
    const { src, uz } = await answer(d);
    await spell(d, 'source', src);
    await spell(d, 'uz', uz);
    await check(d);
    await d.advance(RIGHT_MS);
  }
}

/** Spells the Turkish row correctly and fills the Uzbek row with what is left: a check marks only the Uzbek row wrong. */
async function sourceRightUzWrong(d: Driver) {
  const { src } = await answer(d);
  await spell(d, 'source', src);
  await fillRow(d, 'uz');
}

async function fillBoth(d: Driver) {
  await fillRow(d, 'source');
  await fillRow(d, 'uz');
}

const check = (d: Driver) => d.tap(/^Tekshir/);

export const imloStates: ScreenState[] = [
  {
    id: 'imlo-map-early',
    game: 'imlo',
    title: 'Level map, early: Masjid (levels 16–30), some stars, Oson',
    async reach(d) {
      await d.open({ progress: progress(20, 19) });
      await d.openGame(TITLE);
    },
  },
  {
    id: 'imlo-map-late',
    game: 'imlo',
    title: 'Level map, late: Registon (levels 46–60)',
    async reach(d) {
      await d.open({ progress: progress(55, 54) });
      await d.openGame(TITLE);
    },
  },
  {
    id: 'imlo-countdown',
    game: 'imlo',
    title: 'Ready: the level has opened, countdown at 3',
    async reach(d) {
      await d.open({ progress: progress(1) });
      await d.openGame(TITLE);
      await d.startLevel(1, { countdownMs: 0 });
    },
  },
  {
    id: 'imlo-board-empty',
    game: 'imlo',
    title: 'Board, empty, source row active (Oson, level 1)',
    reach: (d) => board(d),
  },
  {
    id: 'imlo-board-full',
    game: 'imlo',
    title: 'Board, Oʻrta, third pair, both rows full, the check star is ready',
    async reach(d) {
      await board(d, 1, 'Oʻrta');
      await solvePairs(d, 2);
      await fillBoth(d);
      const ready = await d.page.locator('button[data-ready]').count();
      d.check(ready === 1, 'expected the check star to be ready');
    },
  },
  {
    id: 'imlo-wrong',
    game: 'imlo',
    title:
      'Wrong check, Qiyin, fourth pair: only the Uzbek row cracks, the Turkish row glazes, a life is lost',
    async reach(d) {
      await board(d, 1, 'Qiyin');
      await solvePairs(d, 3);
      await sourceRightUzWrong(d);
      await check(d);
      const cracks = await d.page.getByTestId('crack').count();
      d.check(cracks === 1, `expected exactly one cracked row, got ${cracks}`);
    },
  },
  {
    id: 'imlo-pause',
    game: 'imlo',
    title: 'Pause: board hidden, resume or leave',
    async reach(d) {
      await board(d);
      await d.tap('Pauza');
    },
  },
  {
    id: 'imlo-fail',
    game: 'imlo',
    title: 'Fail: the third wrong check',
    async reach(d) {
      await board(d);
      await fillBoth(d);
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          await d.page.getByTestId('row-source').click({ position: { x: 2, y: 2 } });
          for (let k = 0; k < 20; k++) await d.page.keyboard.press('Backspace');
          await fillBoth(d);
        }
        await check(d);
        await d.advance(AFTER_WRONG_MS);
      }
      const heading = await d.page.getByRole('heading', { name: 'Yutqazdingiz' }).count();
      d.check(heading === 1, 'expected the fail screen');
    },
  },
];

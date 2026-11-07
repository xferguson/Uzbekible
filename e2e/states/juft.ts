/** Juft screens (docs/games/01-juft.md, D2 frames). Juft-only moves live here; shell moves come from the driver. */
import type { Page } from '@playwright/test';
import { scoringFor } from '../../src/games/juft/scoring.config.ts';
import type { Driver, ScreenState } from '../shots/types.ts';

const TITLE = 'Juft';
/** Wrong-pair flash in the board (Board.tsx WRONG_MS) plus a margin. */
const AFTER_WRONG_MS = 600;

const ids = (page: Page) =>
  page
    .locator('[data-testid="col-left"] [data-tile-id]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-tile-id')!));

const tile = (page: Page, side: 'left' | 'right', id: string) =>
  page.locator(`[data-testid="col-${side}"] [data-tile-id="${id}"] button`);

async function pairCount(d: Driver, n: number) {
  const got = (await ids(d.page)).length;
  d.check(got === n, `expected ${n} pairs on the board, got ${got}`);
}

async function mismatch(d: Driver) {
  const [a, b] = await ids(d.page);
  d.check(a !== undefined && b !== undefined, 'a mismatch needs at least two pairs');
  await tile(d.page, 'left', a!).click();
  await tile(d.page, 'right', b!).click();
}

/** Opens Juft at `level` (unlocked) and plays the countdown through to the board. */
async function board(d: Driver, level: number, pairs: number) {
  await d.open({ progress: { juft: { unlocked: level } } });
  await d.openGame(TITLE);
  await d.startLevel(level);
  await pairCount(d, pairs);
}

/**
 * Play time on level 1 (one pair, no mistakes) that lands in the middle of the `stars` band of the live scoring
 * config, so the state keeps working when the balance is tuned.
 */
function playMsFor(stars: 1 | 2 | 3): number {
  const { basePoints, parMs, overrunFactor, starThresholds } = scoringFor(1, 1);
  const bands = [...starThresholds, basePoints];
  const lo = bands[stars - 1]!;
  const hi = bands[stars]!;
  const target = (lo + hi) / 2;
  return Math.round(parMs + parMs * (overrunFactor - 1) * (1 - target / basePoints));
}

/**
 * Clears level 1 (one pair) after `playMsFor(stars)` of play, so the elapsed time sets the stars, and checks the result.
 * A best of 1 point on file makes every clear a "new best".
 */
function results(stars: 1 | 2 | 3): ScreenState {
  const waitMs = playMsFor(stars);
  return {
    id: `juft-results-${stars}`,
    game: 'juft',
    title: `Results: ${stars} star${stars > 1 ? 's' : ''}, new best`,
    async reach(d) {
      await d.open({
        progress: { juft: { unlocked: 2, best: { 1: { score: 1, stars: 1, timeMs: 1 } } } },
      });
      await d.openGame(TITLE);
      await d.startLevel(1);
      await d.advance(waitMs);
      const [id] = await ids(d.page);
      await tile(d.page, 'left', id!).click();
      await tile(d.page, 'right', id!).click();
      await d.advance(AFTER_WRONG_MS);
      const shown = await d.page.getByRole('img', { name: `${stars}/3` }).count();
      d.check(shown === 1, `expected ${stars}/3 stars on the results screen`);
    },
  };
}

export const juftStates: ScreenState[] = [
  {
    id: 'juft-map-early',
    game: 'juft',
    title: 'Level map, early: Minora (levels 16–30), some stars',
    async reach(d) {
      const best = Object.fromEntries(
        Array.from({ length: 19 }, (_, i) => [
          i + 1,
          { score: 900, stars: (i % 3) + 1, timeMs: 9000 },
        ]),
      );
      await d.open({ progress: { juft: { unlocked: 20, best } } });
      await d.openGame(TITLE);
    },
  },
  {
    id: 'juft-map-late',
    game: 'juft',
    title: 'Level map, late: Registon (levels 106–120)',
    async reach(d) {
      const best = Object.fromEntries(
        Array.from({ length: 109 }, (_, i) => [i + 1, { score: 900, stars: 3, timeMs: 9000 }]),
      );
      await d.open({ progress: { juft: { unlocked: 110, best } } });
      await d.openGame(TITLE);
    },
  },
  {
    id: 'juft-ready',
    game: 'juft',
    title: 'Ready: the level has opened, countdown at 3',
    async reach(d) {
      await d.open();
      await d.openGame(TITLE);
      await d.startLevel(1, { countdownMs: 0 });
    },
  },
  {
    id: 'juft-countdown',
    game: 'juft',
    title: 'Countdown: mid 3-2-1',
    async reach(d) {
      await d.open();
      await d.openGame(TITLE);
      await d.startLevel(1, { countdownMs: 1500 });
    },
  },
  {
    id: 'juft-board-1',
    game: 'juft',
    title: 'Board, 1 pair (hard-pair level 5)',
    reach: (d) => board(d, 5, 1),
  },
  {
    id: 'juft-board-3',
    game: 'juft',
    title: 'Board, 3 pairs (level 9)',
    reach: (d) => board(d, 9, 3),
  },
  {
    id: 'juft-board-6',
    game: 'juft',
    title: 'Board, 6 pairs (level 29)',
    reach: (d) => board(d, 29, 6),
  },
  {
    id: 'juft-board-8',
    game: 'juft',
    title: 'Board, 8 pairs, mixed source languages (level 59)',
    reach: (d) => board(d, 59, 8),
  },
  {
    id: 'juft-board-12',
    game: 'juft',
    title: 'Board, 12 pairs (Registon, level 106)',
    reach: (d) => board(d, 106, 12),
  },
  {
    id: 'juft-wrong',
    game: 'juft',
    title: 'Wrong pair: crack flash and a life lost',
    async reach(d) {
      await board(d, 59, 8);
      await mismatch(d);
    },
  },
  {
    id: 'juft-hint',
    game: 'juft',
    title: 'Long-press hint: the English gloss (the only English on a board)',
    async reach(d) {
      await board(d, 9, 3);
      const [id] = await ids(d.page);
      await tile(d.page, 'left', id!).focus();
      await d.page.keyboard.press('h');
      const gloss = await d.page.getByRole('status').filter({ hasText: /\S/ }).count();
      d.check(gloss > 0, 'the hint gloss is not showing');
    },
  },
  {
    id: 'juft-pause',
    game: 'juft',
    title: 'Pause: board hidden, resume or leave',
    async reach(d) {
      await board(d, 9, 3);
      await d.tap('Pauza');
    },
  },
  results(3),
  results(2),
  results(1),
  {
    id: 'juft-fail',
    game: 'juft',
    title: 'Fail: the third strike',
    async reach(d) {
      await board(d, 9, 3);
      for (let i = 0; i < 3; i++) {
        await mismatch(d);
        await d.advance(AFTER_WRONG_MS);
      }
      const heading = await d.page.getByRole('heading', { name: 'Yutqazdingiz' }).count();
      d.check(heading === 1, 'expected the fail screen');
    },
  },
];

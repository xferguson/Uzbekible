/** Soxta screens (docs/games/05-soxta.md, J4 frames). Soxta-only moves live here; shell moves come from the driver. */
import { readFileSync } from 'node:fs';
import type { Driver, ScreenState } from '../shots/types.ts';

const TITLE = 'Soxta';
const TICK_MS = 100;
/** Board.tsx REVEAL_MS: the hold on the last answer before results. */
const REVEAL_MS = 1_400;
const COUNTDOWN_MS = 3_000;

type Side = 'left' | 'right';
const opposite = (s: Side): Side => (s === 'left' ? 'right' : 'left');

interface PackItem {
  uz: { latn: string };
  glossEn: string;
}
const PACK = JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')) as {
  items: PackItem[];
};

/** Home → Soxta → the 3-2-1, run for `countdownMs` of it (omitted: all of it, so the first card shows). */
async function open(d: Driver, opts: { cyrl?: boolean; countdownMs?: number } = {}) {
  await d.open({
    settings: { languages: ['tr'], ...(opts.cyrl && { script: 'uz-Cyrl' as const }) },
  });
  await d.tap(new RegExp(`^(${TITLE}|Сохта)$`));
  await d.page.getByRole('status').first().waitFor();
  const run = opts.countdownMs ?? COUNTDOWN_MS + TICK_MS * 2;
  for (let t = 0; t < run; t += TICK_MS) await d.advance(TICK_MS);
  if (opts.countdownMs === undefined) {
    await d.page.getByTestId('soxta-board').waitFor();
    await d.page.evaluate(() => document.fonts.ready);
  }
}

/** Which side the clue belongs to, from the Uzbek word on screen and the pack. */
async function rightSide(d: Driver): Promise<Side> {
  const clue = (await d.page.getByTestId('clue').innerText()).trim();
  const tiles = await Promise.all(
    (['left', 'right'] as const).map(async (side) => ({
      side,
      lines: (await d.page.getByTestId(`tile-${side}`).innerText())
        .split('\n')
        .map((l) => l.trim()),
    })),
  );
  const uz = tiles.find((t) => t.lines[0] === 'UZ')!;
  const word = uz.lines.at(-1)!;
  const item = PACK.items.find((i) => i.uz.latn === word);
  d.check(!!item, `no pack item for the Uzbek word "${word}"`);
  return item!.glossEn === clue ? uz.side : opposite(uz.side);
}

const arrow = (d: Driver, side: Side) =>
  d.page.getByRole('button', { name: side === 'left' ? 'Chap' : 'Oʻng' }).click();

async function wrong(d: Driver) {
  await arrow(d, opposite(await rightSide(d)));
  await d.page.getByTestId('reveal').waitFor();
}

export const soxtaStates: ScreenState[] = [
  {
    id: 'soxta-ready',
    game: 'soxta',
    title: 'Ready: Soxta opens straight from home, countdown at 3',
    async reach(d) {
      await open(d, { countdownMs: 0 });
    },
  },
  {
    id: 'soxta-card',
    game: 'soxta',
    title: 'A fresh card: two words, the English clue between them, full timer',
    async reach(d) {
      await open(d);
      const tags = await d.page.getByText(/^(UZ|TR)$/).count();
      d.check(tags === 2, 'expected the UZ and TR tags on the card');
    },
  },
  {
    id: 'soxta-correct',
    game: 'soxta',
    title: 'Correct: gold glaze, check badge, reveal with both meanings',
    async reach(d) {
      await open(d);
      await arrow(d, await rightSide(d));
      const kind = await d.page.getByTestId('reveal').getAttribute('data-kind');
      d.check(kind === 'correct', `expected a correct reveal, got ${kind}`);
    },
  },
  {
    id: 'soxta-wrong',
    game: 'soxta',
    title: 'Wrong: cracks and a cross on the picked tile, a life lost, the right tile outlined',
    async reach(d) {
      await open(d);
      await wrong(d);
      const cracks = await d.page.getByTestId('cracks').count();
      d.check(cracks === 1, `expected one cracked tile, got ${cracks}`);
    },
  },
  {
    id: 'soxta-timeout',
    game: 'soxta',
    title: 'Timeout in Cyrillic: timer empty, clock banner, a life lost',
    async reach(d) {
      await open(d, { cyrl: true });
      await d.advanceUntil(() => d.page.getByTestId('timeout-pill').isVisible(), { maxMs: 10_000 });
    },
  },
  {
    id: 'soxta-pause',
    game: 'soxta',
    title: 'Pause: cards hidden, resume or leave',
    async reach(d) {
      await open(d);
      await d.tap('Pauza');
    },
  },
  {
    id: 'soxta-results',
    game: 'soxta',
    title: 'Results: the third mistake ends the run',
    async reach(d) {
      await open(d);
      for (let i = 0; i < 3; i++) {
        await wrong(d);
        if (i < 2) await d.page.getByTestId('reveal').click();
      }
      await d.advance(REVEAL_MS + TICK_MS * 2);
      const heading = await d.page.getByRole('heading', { name: 'Yugurish tugadi' }).count();
      d.check(heading === 1, 'expected the run results');
    },
  },
];

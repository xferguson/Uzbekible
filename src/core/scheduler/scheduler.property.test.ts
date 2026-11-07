import fc from 'fast-check';
import { describe, it } from 'vitest';
import { makeItem } from '../content/fixtures.ts';
import type { SourceLang } from '../text/index.ts';
import type { Aggregate } from '../learning-log/index.ts';
import { createRng } from '../random/index.ts';
import { nextItems } from './index.ts';

const opts = { seed: 20240607, numRuns: 200 };
const LANGS = ['tr', 'ru'] as const;

const poolArb = fc
  .array(fc.record({ rank: fc.integer({ min: 1, max: 50 }), lang: fc.constantFrom(...LANGS) }), {
    maxLength: 15,
  })
  .map((rows) =>
    rows.map((r, i) =>
      makeItem({
        id: `i${i}`,
        freqRank: r.rank,
        sources: [
          { lang: r.lang, text: 'x', relation: 'turkic-cognate', confidence: 'high', ref: 'x' },
        ],
      }),
    ),
  );

const historyArb = fc.array(
  fc
    .record({
      n: fc.integer({ min: 0, max: 14 }),
      attempts: fc.integer({ min: 1, max: 10 }),
      lang: fc.constantFrom(...LANGS),
    })
    .chain((r) =>
      fc.integer({ min: 0, max: r.attempts }).map((correct): Aggregate => ({
        itemId: `i${r.n}`,
        sourceLang: r.lang,
        relation: 'turkic-cognate',
        attempts: r.attempts,
        correct,
        meanRtMs: 900,
      })),
    ),
  { maxLength: 20 },
);

const enabledArb = fc.constantFrom<readonly SourceLang[] | undefined>(
  undefined,
  ['tr'],
  ['ru'],
  [...LANGS],
);

describe('nextItems properties', () => {
  it('returns min(n, eligible) distinct items, none filtered out', () => {
    fc.assert(
      fc.property(
        poolArb,
        historyArb,
        fc.integer({ min: 0, max: 20 }),
        enabledArb,
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.integer(),
        (pool, history, n, enabledLangs, reviewRatio, seed) => {
          const out = nextItems(pool, history, n, createRng(seed), { enabledLangs, reviewRatio });
          const eligible = pool.filter(
            (it) => !enabledLangs || it.sources.some((s) => enabledLangs.includes(s.lang)),
          );
          const idsOut = out.map((o) => o.id);
          return (
            out.length === Math.min(n, eligible.length) &&
            new Set(idsOut).size === idsOut.length &&
            out.every((o) => eligible.includes(o))
          );
        },
      ),
      opts,
    );
  });

  it('is deterministic for a seed', () => {
    fc.assert(
      fc.property(
        poolArb,
        historyArb,
        fc.integer({ min: 0, max: 10 }),
        fc.integer(),
        (pool, h, n, seed) => {
          const a = nextItems(pool, h, n, createRng(seed)).map((i) => i.id);
          const b = nextItems(pool, h, n, createRng(seed)).map((i) => i.id);
          return a.join() === b.join();
        },
      ),
      opts,
    );
  });
});

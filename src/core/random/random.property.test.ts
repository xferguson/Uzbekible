import fc from 'fast-check';
import { describe, it } from 'vitest';
import { createRng, sample, shuffle, weightedPick } from './index';

const opts = { seed: 20240607, numRuns: 200 };
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);

describe('random properties', () => {
  it('same seed gives the same sequence', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const a = createRng(seed);
        const b = createRng(seed);
        return Array.from({ length: 20 }, () => a.next() === b.next()).every(Boolean);
      }),
      opts,
    );
  });

  it('int stays within bounds', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: -1000, max: 1000 }), fc.nat(1000), (seed, min, span) => {
        const rng = createRng(seed);
        const max = min + span;
        return Array.from({ length: 20 }, () => rng.int(min, max)).every((x) => x >= min && x <= max);
      }),
      opts,
    );
  });

  it('shuffle is a permutation and deterministic per seed', () => {
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.integer()), (seed, xs) => {
        const out = shuffle(createRng(seed), xs);
        const again = shuffle(createRng(seed), xs);
        return JSON.stringify(sorted(out)) === JSON.stringify(sorted(xs)) && JSON.stringify(out) === JSON.stringify(again);
      }),
      opts,
    );
  });

  it('sample returns distinct positions drawn from the input', () => {
    fc.assert(
      fc.property(fc.integer(), fc.uniqueArray(fc.integer()), fc.nat(50), (seed, xs, n) => {
        const out = sample(createRng(seed), xs, n);
        return out.length === Math.min(n, xs.length) && new Set(out).size === out.length && out.every((x) => xs.includes(x));
      }),
      opts,
    );
  });

  it('weightedPick never returns a zero-weight item', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.tuple(fc.integer(), fc.nat(10)), { minLength: 1 }).filter((xs) => xs.some(([, w]) => w > 0)),
        (seed, pairs) => {
          const rng = createRng(seed);
          const items = pairs.map((_, i) => i);
          const weights = pairs.map(([, w]) => w);
          return Array.from({ length: 20 }, () => weights[weightedPick(rng, items, weights)] > 0).every(Boolean);
        },
      ),
      opts,
    );
  });
});

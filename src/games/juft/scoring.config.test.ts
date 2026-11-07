import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { score, starsForScore } from '../../core/scoring/index.ts';
import { CYRILLIC_MULTIPLIER, juftScoring, parMsFor, scoringFor } from './scoring.config.ts';

const opts = { seed: 20261107, numRuns: 200 };
const level = fc.integer({ min: 1, max: 200 });
const pairs = fc.integer({ min: 1, max: 12 });

describe('juft scoring config', () => {
  it('par grows with pair count and never loosens with level', () => {
    fc.assert(
      fc.property(level, level, pairs, (a, b, p) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        return parMsFor(hi, p) <= parMsFor(lo, p) && parMsFor(lo, p) < parMsFor(lo, p + 1);
      }),
      opts,
    );
  });

  it('has ascending star thresholds that a clean par run reaches 3 stars on', () => {
    fc.assert(
      fc.property(level, pairs, (l, p) => {
        const c = scoringFor(l, p);
        const [one, two, three] = c.starThresholds;
        const clean = score({ timeMs: c.parMs, mistakes: 0, hints: 0, combos: p }, c);
        return one < two && two < three && starsForScore(clean, c.starThresholds) === 3;
      }),
      opts,
    );
  });

  it('keeps the score monotone in time, mistakes and hints', () => {
    fc.assert(
      fc.property(level, pairs, fc.nat(300_000), fc.nat(5), fc.nat(5), (l, p, t, m, h) => {
        const c = scoringFor(l, p);
        const base = { timeMs: t, mistakes: m, hints: h, combos: p };
        const s = score(base, c);
        return (
          s >= 0 &&
          score({ ...base, timeMs: t + 1000 }, c) <= s &&
          score({ ...base, mistakes: m + 1 }, c) <= s &&
          score({ ...base, hints: h + 1 }, c) <= s
        );
      }),
      opts,
    );
  });

  it('rejects bad input and exposes a reference config and Cyrillic bonus', () => {
    expect(() => parMsFor(0, 3)).toThrow(RangeError);
    expect(() => parMsFor(1, 0)).toThrow(RangeError);
    expect(juftScoring.parMs).toBe(parMsFor(60, 8));
    expect(CYRILLIC_MULTIPLIER).toBeGreaterThan(1);
    const c = scoringFor(1, 4);
    const r = { timeMs: c.parMs, mistakes: 0, hints: 0, combos: 4 };
    expect(score({ ...r, multipliers: [CYRILLIC_MULTIPLIER] }, c)).toBeGreaterThan(score(r, c));
  });
});

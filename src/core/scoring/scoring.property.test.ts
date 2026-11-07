import fc from 'fast-check';
import { describe, it } from 'vitest';
import { score, starsForScore, type ScoringConfig } from './index';

const opts = { seed: 20240607, numRuns: 300 };

const config: ScoringConfig = {
  basePoints: 1000,
  parMs: 45_000,
  overrunFactor: 2.5,
  mistakePenalty: 80,
  hintPenalty: 120,
  comboBonus: 7,
  starThresholds: [200, 500, 800],
};

const time = fc.integer({ min: 0, max: 500_000 });
const count = fc.integer({ min: 0, max: 40 });
const mult = fc.array(fc.double({ min: 0, max: 4, noNaN: true }), { maxLength: 3 });
const result = fc.record({
  timeMs: time,
  mistakes: count,
  hints: count,
  combos: count,
  multipliers: mult,
});

describe('score invariants', () => {
  it('is a non-negative integer', () => {
    fc.assert(
      fc.property(result, (r) => {
        const s = score(r, config);
        return s >= 0 && Number.isInteger(s);
      }),
      opts,
    );
  });

  it('faster is never lower', () => {
    fc.assert(
      fc.property(result, time, (r, other) => {
        const [fast, slow] = r.timeMs <= other ? [r.timeMs, other] : [other, r.timeMs];
        return score({ ...r, timeMs: fast }, config) >= score({ ...r, timeMs: slow }, config);
      }),
      opts,
    );
  });

  it('more mistakes or hints are never higher', () => {
    fc.assert(
      fc.property(result, fc.integer({ min: 1, max: 10 }), (r, extra) => {
        const base = score(r, config);
        return (
          score({ ...r, mistakes: r.mistakes + extra }, config) <= base &&
          score({ ...r, hints: r.hints + extra }, config) <= base
        );
      }),
      opts,
    );
  });

  it('more combos are never lower', () => {
    fc.assert(
      fc.property(
        result,
        fc.integer({ min: 1, max: 10 }),
        (r, extra) => score({ ...r, combos: r.combos + extra }, config) >= score(r, config),
      ),
      opts,
    );
  });

  it('stars are 0-3 and monotonic in score', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), fc.integer({ min: 0, max: 5000 }), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        const sLo = starsForScore(lo, config.starThresholds);
        const sHi = starsForScore(hi, config.starThresholds);
        return sLo >= 0 && sHi <= 3 && sLo <= sHi;
      }),
      opts,
    );
  });
});

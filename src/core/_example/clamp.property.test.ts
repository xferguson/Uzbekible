// Convention: invariants (round-trips, bounds, permutations, monotonicity) live in
// `<module>.property.test.ts` next to the unit test, using fast-check.
// Seeds are fixed so runs are deterministic (no Math.random in tests).
import fc from 'fast-check';
import { describe, it } from 'vitest';
import { clamp } from './clamp.ts';

const opts = { seed: 20240607, numRuns: 200 };

describe('clamp (example property test)', () => {
  it('always lands within [lo, hi]', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (x, a, b) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const y = clamp(x, lo, hi);
        return y >= lo && y <= hi;
      }),
      opts,
    );
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (x, a, b) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return clamp(clamp(x, lo, hi), lo, hi) === clamp(x, lo, hi);
      }),
      opts,
    );
  });

  it('leaves in-range values unchanged', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1000 }), (x) => clamp(x, -1000, 1000) === x),
      opts,
    );
  });
});

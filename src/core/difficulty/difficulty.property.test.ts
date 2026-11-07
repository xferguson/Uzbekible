import fc from 'fast-check';
import { describe, it } from 'vitest';
import { paramsFor, type DifficultyConfig } from './index';

const opts = { seed: 20240607, numRuns: 300 };

const level = fc.integer({ min: 1, max: 200 });
const num = fc.double({ min: 0, max: 1000, noNaN: true });

const stepCurve = fc
  .array(fc.record({ fromLevel: level, value: num }), { minLength: 1, maxLength: 6 })
  .map((steps) => {
    const levels = [...new Set(steps.map((s) => s.fromLevel))].sort((a, b) => a - b);
    const values = steps.map((s) => s.value).sort((a, b) => a - b);
    return { type: 'step' as const, steps: levels.map((fromLevel, i) => ({ fromLevel, value: values[i % values.length] ?? 0 })) };
  })
  .map((c) => ({ ...c, steps: c.steps.map((s, i, a) => ({ ...s, value: Math.max(s.value, a[i - 1]?.value ?? 0) })) }));

const linearCurve = fc
  .tuple(level, level, num, num)
  .map(([a, b, x, y]) => ({ type: 'linear' as const, fromLevel: Math.min(a, b), toLevel: Math.max(a, b), from: Math.min(x, y), to: Math.max(x, y) }));

const logisticCurve = fc
  .tuple(num, num, fc.double({ min: 0, max: 200, noNaN: true }), fc.double({ min: 0.01, max: 2, noNaN: true }))
  .map(([x, y, midpoint, steepness]) => ({ type: 'logistic' as const, min: Math.min(x, y), max: Math.max(x, y), midpoint, steepness }));

const curve = fc.oneof(stepCurve, linearCurve, logisticCurve);

describe('difficulty invariants', () => {
  it('params are non-decreasing in level when no special levels are declared', () => {
    fc.assert(
      fc.property(curve, level, level, (c, a, b) => {
        const config: DifficultyConfig = { params: { p: c } };
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        return paramsFor(lo, config).p! <= paramsFor(hi, config).p! + 1e-9;
      }),
      opts,
    );
  });

  it('is non-decreasing across non-special levels even when specials exist', () => {
    fc.assert(
      fc.property(curve, level, level, level, (c, a, b, sp) => {
        const config: DifficultyConfig = { params: { p: c }, special: { [sp]: { p: 0 } } };
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        if (lo === sp || hi === sp) return true;
        return paramsFor(lo, config).p! <= paramsFor(hi, config).p! + 1e-9;
      }),
      opts,
    );
  });

  it('special levels return exactly the declared override', () => {
    fc.assert(
      fc.property(curve, level, num, (c, sp, v) => paramsFor(sp, { params: { p: c }, special: { [sp]: { p: v } } }).p === v),
      opts,
    );
  });

  it('values stay within the declared bounds of a curve', () => {
    fc.assert(
      fc.property(logisticCurve, level, (c, l) => {
        const v = paramsFor(l, { params: { p: c } }).p!;
        return v >= c.min - 1e-9 && v <= c.max + 1e-9;
      }),
      opts,
    );
  });
});

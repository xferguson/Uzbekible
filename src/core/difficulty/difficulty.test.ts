import { describe, expect, it } from 'vitest';
import { paramsFor, type DifficultyConfig } from './index.ts';

const config: DifficultyConfig = {
  params: {
    pairs: { type: 'step', steps: [{ fromLevel: 1, value: 4 }, { fromLevel: 4, value: 6 }, { fromLevel: 10, value: 12 }] },
    transparency: { type: 'linear', fromLevel: 1, toLevel: 11, from: 1, to: 0 },
    parMs: { type: 'logistic', min: 30_000, max: 90_000, midpoint: 10, steepness: 0.5 },
    lives: { type: 'linear', fromLevel: 1, toLevel: 5, from: 3, to: 5.4, round: true },
  },
  special: { 7: { pairs: 5, transparency: 0.9 } },
};

describe('paramsFor', () => {
  it('evaluates step curves by the last step at or below the level', () => {
    expect(paramsFor(1, config).pairs).toBe(4);
    expect(paramsFor(3, config).pairs).toBe(4);
    expect(paramsFor(4, config).pairs).toBe(6);
    expect(paramsFor(9, config).pairs).toBe(6);
    expect(paramsFor(10, config).pairs).toBe(12);
    expect(paramsFor(99, config).pairs).toBe(12);
  });

  it('uses the first step value below the first step', () => {
    expect(paramsFor(0, config).pairs).toBe(4);
  });

  it('interpolates linear curves and clamps outside the range', () => {
    expect(paramsFor(1, config).transparency).toBe(1);
    expect(paramsFor(6, config).transparency).toBeCloseTo(0.5);
    expect(paramsFor(11, config).transparency).toBe(0);
    expect(paramsFor(50, config).transparency).toBe(0);
    expect(paramsFor(-3, config).transparency).toBe(1);
  });

  it('evaluates logistic curves between min and max, half-way at the midpoint', () => {
    expect(paramsFor(10, config).parMs).toBeCloseTo(60_000);
    expect(paramsFor(1, config).parMs).toBeLessThan(paramsFor(30, config).parMs!);
    expect(paramsFor(200, config).parMs).toBeLessThanOrEqual(90_000);
    expect(paramsFor(-200, config).parMs).toBeGreaterThanOrEqual(30_000);
  });

  it('rounds when asked', () => {
    expect(paramsFor(3, config).lives).toBe(4);
  });

  it('lets special levels override named params only', () => {
    const p = paramsFor(7, config);
    expect(p.pairs).toBe(5);
    expect(p.transparency).toBe(0.9);
    expect(p.parMs).toBeCloseTo(paramsFor(6, config).parMs!, -5);
    expect(paramsFor(8, config).pairs).toBe(6);
  });

  it('handles a degenerate linear range (fromLevel === toLevel)', () => {
    const c: DifficultyConfig = { params: { x: { type: 'linear', fromLevel: 3, toLevel: 3, from: 2, to: 8 } } };
    expect(paramsFor(2, c).x).toBe(2);
    expect(paramsFor(3, c).x).toBe(8);
  });

  it('sorts unsorted steps and rejects empty ones', () => {
    const c: DifficultyConfig = { params: { x: { type: 'step', steps: [{ fromLevel: 5, value: 9 }, { fromLevel: 1, value: 1 }] } } };
    expect(paramsFor(2, c).x).toBe(1);
    expect(paramsFor(5, c).x).toBe(9);
    expect(() => paramsFor(1, { params: { x: { type: 'step', steps: [] } } })).toThrow(RangeError);
  });

  it('rejects non-finite or fractional levels', () => {
    expect(() => paramsFor(Number.NaN, config)).toThrow(RangeError);
    expect(() => paramsFor(1.5, config)).toThrow(RangeError);
  });
});

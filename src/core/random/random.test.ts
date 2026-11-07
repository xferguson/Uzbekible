import { describe, expect, it } from 'vitest';
import { createRng, sample, seedFrom, shuffle, weightedPick } from './index.ts';

describe('seedFrom', () => {
  it('is stable and distinguishes strings', () => {
    expect(seedFrom('uzbek')).toBe(seedFrom('uzbek'));
    expect(seedFrom('a')).not.toBe(seedFrom('b'));
    expect(Number.isInteger(seedFrom(''))).toBe(true);
  });
});

describe('createRng', () => {
  it('next() is in [0, 1)', () => {
    const rng = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int(min,max) is inclusive and handles min === max', () => {
    const rng = createRng(2);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rng.int(3, 5));
    expect([...seen].sort()).toEqual([3, 4, 5]);
    expect(rng.int(7, 7)).toBe(7);
  });

  it('rejects an inverted or non-integer range', () => {
    const rng = createRng(2);
    expect(() => rng.int(5, 3)).toThrow(RangeError);
    expect(() => rng.int(0.5, 2)).toThrow(RangeError);
  });
});

describe('shuffle', () => {
  it('does not mutate its input', () => {
    const input = [1, 2, 3, 4];
    shuffle(createRng(3), input);
    expect(input).toEqual([1, 2, 3, 4]);
  });
  it('handles empty and single arrays', () => {
    expect(shuffle(createRng(3), [])).toEqual([]);
    expect(shuffle(createRng(3), ['x'])).toEqual(['x']);
  });
});

describe('sample', () => {
  it('returns n distinct elements, capped at the array length', () => {
    const out = sample(createRng(4), [1, 2, 3, 4, 5], 3);
    expect(new Set(out).size).toBe(3);
    expect(sample(createRng(4), [1, 2], 10)).toHaveLength(2);
    expect(sample(createRng(4), [1, 2], 0)).toEqual([]);
  });
  it('rejects a negative count', () => {
    expect(() => sample(createRng(4), [1], -1)).toThrow(RangeError);
  });
});

describe('weightedPick', () => {
  it('picks the only positive-weight item', () => {
    expect(weightedPick(createRng(5), ['a', 'b', 'c'], [0, 2, 0])).toBe('b');
  });
  it('follows the weights roughly', () => {
    const rng = createRng(6);
    let heavy = 0;
    for (let i = 0; i < 2000; i++) if (weightedPick(rng, ['h', 'l'], [9, 1]) === 'h') heavy++;
    expect(heavy).toBeGreaterThan(1650);
  });
  it('rejects bad input', () => {
    const rng = createRng(5);
    expect(() => weightedPick(rng, [], [])).toThrow(RangeError);
    expect(() => weightedPick(rng, ['a'], [0])).toThrow(RangeError);
    expect(() => weightedPick(rng, ['a'], [-1])).toThrow(RangeError);
    expect(() => weightedPick(rng, ['a', 'b'], [1])).toThrow(RangeError);
  });
});

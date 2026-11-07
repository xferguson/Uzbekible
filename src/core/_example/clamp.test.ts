import { describe, expect, it } from 'vitest';
import { clamp } from './clamp.ts';

describe('clamp', () => {
  it('clamps below, above and inside the range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('rejects an inverted range', () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

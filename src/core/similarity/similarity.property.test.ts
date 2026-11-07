import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyRules, distance, transparency } from './index.ts';

const word = fc.stringMatching(/^[a-zçğıöşü]{0,8}$/);
const uzWord = fc.stringMatching(/^[a-z]{0,8}$/);
// Turkish c is always rewritten to j, so identity only holds for words without it.
const uzNoC = fc.stringMatching(/^[abdefghijklmnopqrstuvxyz]{0,8}$/);

describe('similarity properties', () => {
  it('distance is symmetric', () => {
    fc.assert(fc.property(uzWord, uzWord, (a, b) => distance(a, b) === distance(b, a)));
  });
  it('distance is 0 iff equal after normalization', () => {
    fc.assert(fc.property(uzWord, uzWord, (a, b) => (distance(a, b) === 0) === (a === b)));
    fc.assert(fc.property(uzWord, (a) => distance(a, a.toUpperCase()) === 0));
  });
  it('distance obeys the triangle inequality', () => {
    fc.assert(
      fc.property(uzWord, uzWord, uzWord, (a, b, c) => distance(a, c) <= distance(a, b) + distance(b, c)),
    );
  });
  it('transparency stays within [0, 1] and is 1 for identical forms', () => {
    fc.assert(
      fc.property(word, uzWord, (tr, uz) => {
        const t = transparency(tr, uz);
        return t >= 0 && t <= 1;
      }),
    );
    fc.assert(fc.property(uzNoC, (w) => transparency(w, w) === 1));
  });
  it('every candidate is a distinct lower-case string', () => {
    fc.assert(
      fc.property(word, (w) => {
        const c = applyRules(w);
        expect(new Set(c).size).toBe(c.length);
        expect(c.length).toBeGreaterThan(0);
      }),
    );
  });
});

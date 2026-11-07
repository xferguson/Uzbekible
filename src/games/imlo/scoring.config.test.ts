import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { score, starsForScore } from '../../core/scoring/index.ts';
import type { LevelSpec } from '../types.ts';
import type { ImloMode, ImloPair, ImloParams } from './levels.ts';
import {
  CYRILLIC_MULTIPLIER,
  MODE_MULTIPLIER,
  imloMultipliers,
  scoringFor,
} from './scoring.config.ts';

const opts = { seed: 20261107, numRuns: 200 };
const MODES: ImloMode[] = ['oson', 'orta', 'qiyin'];

function pair(src: number, uz: number, extra: number): ImloPair {
  const letters = (n: number, c: string) => Array.from({ length: n }, () => c);
  return {
    itemId: 'x',
    clue: 'x',
    source: { lang: 'tr', text: 'x', letters: letters(src, 'a') },
    uz: { text: 'x', letters: letters(uz, 'b') },
    bank: [
      ...letters(src, 'a').map((letter, i) => ({ id: `s${i}`, letter, origin: 'source' as const })),
      ...letters(uz, 'b').map((letter, i) => ({ id: `u${i}`, letter, origin: 'uz' as const })),
      ...letters(extra, 'c').map((letter, i) => ({
        id: `d${i}`,
        letter,
        origin: 'distractor' as const,
      })),
    ],
  };
}

function spec(level: number, mode: ImloMode, pairs: ImloPair[]): LevelSpec<ImloParams> {
  return { level, seed: 's', lives: 3, params: { pairs, mode } };
}

const pairArb = fc
  .tuple(
    fc.integer({ min: 2, max: 8 }),
    fc.integer({ min: 2, max: 8 }),
    fc.integer({ min: 0, max: 4 }),
  )
  .map(([s, u, e]) => pair(s, u, e));
const specArb = fc
  .tuple(
    fc.integer({ min: 1, max: 60 }),
    fc.constantFrom(...MODES),
    fc.array(pairArb, { minLength: 1, maxLength: 8 }),
  )
  .map(([l, m, p]) => spec(l, m, p));

describe('imlo scoring config', () => {
  it('a flawless level at par earns 3 stars in every mode', () => {
    fc.assert(
      fc.property(specArb, fc.constantFrom<'latn' | 'cyrl'>('latn', 'cyrl'), (s, script) => {
        const c = scoringFor(s);
        const mult = imloMultipliers({ sourceLangs: ['tr'], script }, s.params.mode);
        const n = s.params.pairs.length;
        const value = score(
          { timeMs: c.parMs, mistakes: 0, hints: 0, combos: n, multipliers: mult },
          c,
        );
        return starsForScore(value, c.starThresholds) === 3;
      }),
      opts,
    );
  });

  it('par grows with letters and with bank size, and tightens with level', () => {
    const base = scoringFor(spec(10, 'oson', [pair(3, 3, 0)])).parMs;
    expect(scoringFor(spec(10, 'oson', [pair(5, 3, 0)])).parMs).toBeGreaterThan(base);
    expect(scoringFor(spec(10, 'qiyin', [pair(3, 3, 2)])).parMs).toBeGreaterThan(base);
    expect(scoringFor(spec(10, 'oson', [pair(3, 3, 0), pair(3, 3, 0)])).parMs).toBeGreaterThan(
      base,
    );
    expect(scoringFor(spec(60, 'oson', [pair(3, 3, 0)])).parMs).toBeLessThan(base);
  });

  it('has ascending thresholds and a score that never rises with time, wrong checks or hints', () => {
    fc.assert(
      fc.property(specArb, fc.nat(400_000), fc.nat(5), fc.nat(5), (s, t, m, h) => {
        const c = scoringFor(s);
        const [one, two, three] = c.starThresholds;
        const base = { timeMs: t, mistakes: m, hints: h, combos: s.params.pairs.length };
        const v = score(base, c);
        return (
          one < two &&
          two < three &&
          v >= 0 &&
          score({ ...base, timeMs: t + 1000 }, c) <= v &&
          score({ ...base, mistakes: m + 1 }, c) <= v &&
          score({ ...base, hints: h + 1 }, c) <= v
        );
      }),
      opts,
    );
  });

  it('multiplies by mode and for Cyrillic', () => {
    expect(MODE_MULTIPLIER).toEqual({ oson: 1, orta: 1.25, qiyin: 1.5 });
    expect(imloMultipliers({ sourceLangs: ['tr'], script: 'latn' }, 'oson')).toEqual([1]);
    expect(imloMultipliers({ sourceLangs: ['tr'], script: 'cyrl' }, 'qiyin')).toEqual([
      1.5,
      CYRILLIC_MULTIPLIER,
    ]);
    expect(imloMultipliers({ sourceLangs: ['tr'], script: 'latn' })).toEqual([1]);
  });

  it('rejects an empty level', () => {
    expect(() => scoringFor(spec(1, 'oson', []))).toThrow(RangeError);
  });
});

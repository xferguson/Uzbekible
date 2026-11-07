import { describe, expect, it } from 'vitest';
import { simulate } from '../../core/sim/index.ts';
import type { ImloMode } from './levels.ts';
import {
  IMLO_PROFILES,
  hardLetterTransparency,
  imloSimDefinition,
  imloSimGame,
} from './balance.ts';

const spec = (level: number, mode: ImloMode) =>
  imloSimDefinition(level, mode).levels({
    level,
    mode,
    settings: { sourceLangs: ['tr'], script: 'latn' },
    history: [],
    seed: 's',
    rng: { next: () => 0 } as never,
  });

const run = (level: number, mode: ImloMode, profile: string, runs = 60) =>
  simulate({
    game: imloSimGame(level, mode),
    profiles: [IMLO_PROFILES[profile]!],
    levels: [level],
    runs,
    seed: 3,
  })[0]!;

describe('imlo balance harness', () => {
  it('follows the level curve: 5 pairs to 8, words growing, distractors only in Qiyin', () => {
    expect(spec(1, 'oson').params.pairs).toHaveLength(5);
    expect(spec(60, 'oson').params.pairs).toHaveLength(8);
    for (const p of spec(1, 'oson').params.pairs) {
      expect(p.uz.letters.length).toBeGreaterThanOrEqual(2);
      expect(p.bank).toHaveLength(p.source.letters.length + p.uz.letters.length);
    }
    for (const p of spec(60, 'qiyin').params.pairs) {
      expect(p.bank.filter((t) => t.origin === 'distractor')).toHaveLength(4);
      expect(p.uz.letters.length).toBeLessThanOrEqual(8);
    }
    expect(spec(1, 'orta').params.pairs[0]!.bank.some((t) => t.origin === 'distractor')).toBe(
      false,
    );
  });

  it('makes hard letters harder with level and with distractors, always within 0..1', () => {
    for (let l = 1; l <= 60; l++) {
      for (const d of [0, 2, 4]) {
        const t = hardLetterTransparency(l, d);
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThanOrEqual(1);
      }
    }
    expect(hardLetterTransparency(60, 0)).toBeLessThan(hardLetterTransparency(1, 0));
    expect(hardLetterTransparency(30, 4)).toBeLessThan(hardLetterTransparency(30, 0));
  });

  it('is deterministic and finishes every run', () => {
    expect(run(20, 'qiyin', 'b1-turkish')).toEqual(run(20, 'qiyin', 'b1-turkish'));
    expect(run(60, 'oson', 'expert').completionRate).toBeGreaterThan(0.8);
  });

  it('gives the expert three stars and Qiyin is harder than Oson for a B1 player', () => {
    const expert = run(40, 'qiyin', 'expert', 100);
    expect(expert.stars[3]).toBeGreaterThan(70);
    const oson = run(45, 'oson', 'b1-turkish', 200);
    const qiyin = run(45, 'qiyin', 'b1-turkish', 200);
    expect(qiyin.completionRate).toBeLessThan(oson.completionRate);
    expect(qiyin.medianMistakes).toBeGreaterThanOrEqual(oson.medianMistakes);
  });
});

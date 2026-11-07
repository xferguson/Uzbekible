/**
 * Imlo's initial curve (docs/games/06-imlo.md, "Level progression"): 60 levels in four chapters of 15, 5 -> 8 pairs
 * and growing words. Config only: tune here, validate by simulation (I8).
 */
import type { DifficultyConfig, StepCurve } from '@core/difficulty/index.ts';

export const LEVEL_COUNT = 60;
export const CHAPTER_SIZE = 15;
/** Words never exceed this many letters (the board and bank are designed around it). */
export const MAX_LETTERS = 8;
export const MIN_LETTERS = 2;
export const LIVES = 3;

export type ImloParamKey = 'pairs' | 'minLetters' | 'maxLetters' | 'distractors';

/** One value per chapter, held for its 15 levels. */
function perChapter(values: readonly number[]): StepCurve {
  return {
    type: 'step',
    steps: values.map((value, c) => ({ fromLevel: c * CHAPTER_SIZE + 1, value })),
  };
}

/** Linear between the first and last level of the game, rounded. */
function ramp(from: number, to: number): StepCurve {
  return {
    type: 'step',
    round: true,
    steps: Array.from({ length: LEVEL_COUNT }, (_, i) => ({
      fromLevel: i + 1,
      value: from + ((to - from) * i) / (LEVEL_COUNT - 1),
    })),
  };
}

export const imloDifficulty: DifficultyConfig<ImloParamKey> = {
  params: {
    /** 5 pairs at first, 8 in the last chapter. */
    pairs: perChapter([5, 6, 7, 8]),
    minLetters: perChapter([2, 3, 3, 4]),
    maxLetters: perChapter([4, 5, 6, 8]),
    /** Extra tiles in Qiyin only: 2 at level 1, 4 at level 60. */
    distractors: ramp(2, 4),
  },
};

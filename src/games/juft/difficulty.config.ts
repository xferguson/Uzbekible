/**
 * Juft's initial difficulty curve (docs/games/01-juft.md): 120 levels in 8 chapters of 15, pairs ramping 1 -> 12,
 * a one-pair hard-pair breather every 5th level up to the last chapter. Config only: tune here, validate by simulation.
 */
import type { DifficultyConfig, StepCurve } from '@core/difficulty/index.ts';

export const LEVEL_COUNT = 120;
export const CHAPTER_SIZE = 15;
/** The board never grows past this; beyond it difficulty comes from content and par time. */
export const MAX_PAIRS = 12;
/** Hard-pair levels are every 5th level through the end of chapter 7; chapter 8 is the full board. */
export const HARD_EVERY = 5;
export const LAST_HARD_LEVEL = 105;

export type JuftParamKey = 'pairs' | 'hard' | 'suffixedShare' | 'minTransparency' | 'parPerPairMs';

/** Pairs at the first and last level of each chapter; linear in between. */
const CHAPTER_PAIRS: readonly (readonly [number, number])[] = [
  [1, 4],
  [4, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [12, 12],
];

/** A step curve holding one value per level, interpolated linearly between `points` (level, value). */
function piecewise(points: readonly (readonly [number, number])[], round = false): StepCurve {
  const steps: { fromLevel: number; value: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [l0, v0] = points[i]!;
    const [l1, v1] = points[i + 1]!;
    for (let l = l0; l < l1; l++)
      steps.push({ fromLevel: l, value: v0 + ((v1 - v0) * (l - l0)) / (l1 - l0) });
  }
  const [lastLevel, lastValue] = points[points.length - 1]!;
  steps.push({ fromLevel: lastLevel, value: lastValue });
  return { type: 'step', steps, round };
}

const pairSteps: StepCurve = {
  type: 'step',
  round: true,
  steps: CHAPTER_PAIRS.flatMap(([from, to], c) =>
    Array.from({ length: CHAPTER_SIZE }, (_, i) => ({
      fromLevel: c * CHAPTER_SIZE + 1 + i,
      value: from + ((to - from) * i) / (CHAPTER_SIZE - 1),
    })),
  ),
};

const hardLevels: Record<number, Partial<Record<JuftParamKey, number>>> = {};
for (let l = HARD_EVERY; l <= LAST_HARD_LEVEL; l += HARD_EVERY)
  hardLevels[l] = { pairs: 1, hard: 1, suffixedShare: 0 };

export const juftDifficulty: DifficultyConfig<JuftParamKey> = {
  params: {
    pairs: pairSteps,
    hard: { type: 'step', steps: [{ fromLevel: 1, value: 0 }] },
    /** Share of suffixed (inflected) pairs: none before chapter 5 (level 61), then rising. */
    suffixedShare: piecewise([
      [60, 0],
      [61, 0.2],
      [120, 0.6],
    ]),
    /** Lowest Turkish->Uzbek transparency a lemma may have: opaque cognates enter gradually. */
    minTransparency: piecewise([
      [1, 0.8],
      [30, 0.6],
      [60, 0.35],
      [90, 0.1],
      [105, 0],
    ]),
    /** Par time per pair; the tightening is the "shorter par" in chapters 7-8. */
    parPerPairMs: piecewise([
      [1, 5000],
      [120, 2800],
    ]),
  },
  special: hardLevels,
};

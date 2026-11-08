/**
 * Soxta numbers (docs/games/05-soxta.md, "Core loop"). Config only: tune here, validate by simulation.
 * Streak is the difficulty axis: the per-card time limit tightens with it via `core/difficulty`.
 */
import type { DifficultyConfig } from '../../core/difficulty/index.ts';
import type { ScoringConfig } from '../../core/scoring/index.ts';

/** Mistakes (wrong swipe or timeout) a run survives. */
export const LIVES = 3;

/** Every Nth card drawn is a missed card coming back, when there is one. */
export const RESURFACE_EVERY = 4;

export type SoxtaParamKey = 'cardMs';

/** Per-card time limit by streak: 6 s at a streak of 0, 2.5 s from a streak of 30. */
export const soxtaDifficulty: DifficultyConfig<SoxtaParamKey> = {
  params: {
    cardMs: { type: 'linear', fromLevel: 0, toLevel: 30, from: 6000, to: 2500, round: true },
  },
};

/** Points for one correct card before the streak multiplier. */
export const CARD_POINTS = 100;

/** A card is worth `CARD_POINTS * multiplier`; the multiplier steps up every `STREAK_STEP` correct in a row. */
export const STREAK_STEP = 5;
export const STREAK_BONUS = 0.5;
export const MAX_MULTIPLIER = 3;

export const streakMultiplier = (streak: number): number =>
  Math.min(MAX_MULTIPLIER, 1 + Math.floor(Math.max(0, streak) / STREAK_STEP) * STREAK_BONUS);

/** `core/scoring` config for a single card: time decay is off (par is the card timer), so only the multiplier applies. */
export const cardScoring: ScoringConfig = {
  basePoints: CARD_POINTS,
  parMs: Number.MAX_SAFE_INTEGER / 4,
  overrunFactor: 2,
  mistakePenalty: 0,
  hintPenalty: 0,
  comboBonus: 0,
  starThresholds: [500, 1500, 3000],
};

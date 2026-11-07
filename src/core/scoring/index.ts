/** Pure, config-driven game scoring: time decay vs par, penalties, combo bonus, multipliers, stars. */

export interface ScoreInput {
  timeMs: number;
  mistakes: number;
  hints: number;
  /** Combo units earned (games decide what counts as one, e.g. each consecutive correct match). */
  combos: number;
  /** Extra multipliers (e.g. daily bonus), applied after penalties and bonuses. Negatives count as 0. */
  multipliers?: readonly number[];
}

export interface ScoringConfig {
  /** Points for finishing at or under par, before penalties. */
  basePoints: number;
  /** Par time; no decay at or below it. */
  parMs: number;
  /** Time-points reach 0 at `parMs * overrunFactor` (> 1); linear in between. */
  overrunFactor: number;
  mistakePenalty: number;
  hintPenalty: number;
  comboBonus: number;
  /** Ascending score thresholds for 1, 2 and 3 stars. */
  starThresholds: readonly [number, number, number];
}

export type Stars = 0 | 1 | 2 | 3;

function assertCount(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a finite number >= 0`);
}

function timePoints(timeMs: number, config: ScoringConfig): number {
  const { basePoints, parMs, overrunFactor } = config;
  if (timeMs <= parMs) return basePoints;
  const window = parMs * (overrunFactor - 1);
  if (window <= 0) return 0;
  return basePoints * Math.max(0, 1 - (timeMs - parMs) / window);
}

export function score(result: ScoreInput, config: ScoringConfig): number {
  assertCount('timeMs', result.timeMs);
  assertCount('mistakes', result.mistakes);
  assertCount('hints', result.hints);
  assertCount('combos', result.combos);
  if (!(config.overrunFactor > 1)) throw new RangeError('overrunFactor must be > 1');

  const raw =
    timePoints(result.timeMs, config) -
    result.mistakes * config.mistakePenalty -
    result.hints * config.hintPenalty +
    result.combos * config.comboBonus;
  const multiplier = (result.multipliers ?? []).reduce((acc, m) => acc * Math.max(0, m), 1);
  return Math.max(0, Math.round(Math.max(0, raw) * multiplier));
}

export function starsForScore(value: number, thresholds: ScoringConfig['starThresholds']): Stars {
  const [one, two, three] = thresholds;
  if (!(one <= two && two <= three)) throw new RangeError('starThresholds must be ascending');
  if (value >= three) return 3;
  if (value >= two) return 2;
  if (value >= one) return 1;
  return 0;
}

export function stars(result: ScoreInput, config: ScoringConfig): Stars {
  return starsForScore(score(result, config), config.starThresholds);
}

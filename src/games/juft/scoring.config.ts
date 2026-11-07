/**
 * Juft scoring parameters. Numbers only: the formulas live in `core/scoring`. Par time and star thresholds
 * scale with the pair count (a 12-pair board is not 12x a 1-pair board's par) and tighten with the level.
 * Validated by simulation: see `docs/games/01-juft-balance.md`.
 */
import type { ScoringConfig } from '../../core/scoring/index.ts';

/**
 * Par = fixed + pairs * (base(level) + scan * (pairs + 1)): each pair costs two taps, and every tap also pays a
 * visual search over the tiles still on screen, so big boards need a longer par per pair. Set at about 75% of the
 * `b1-turkish` sim time, so a B1 player lands on two stars and an expert on three.
 */
export const PAR = {
  /** Time to read the board before the first tap. */
  fixedMs: 1500,
  /** Per-pair base at level 1 and at `tightestLevel`; linear between, flat after. */
  baseStartMs: 4000,
  baseEndMs: 2800,
  tightestLevel: 120,
  /** Extra per-pair ms for each tile pair on the board. */
  scanMsPerPair: 225,
} as const;

export const POINTS = {
  basePoints: 1000,
  overrunFactor: 3,
  mistakePenalty: 80,
  hintPenalty: 150,
  comboBonus: 10,
  /** Stars as shares of `basePoints` (1, 2, 3 stars). */
  starShares: [0.25, 0.6, 0.9],
} as const;

/** Score multiplier for reading the Uzbek side in Cyrillic (the labelled hard mode). */
export const CYRILLIC_MULTIPLIER = 1.2;

export function parMsFor(level: number, pairs: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError('level must be an integer >= 1');
  if (!Number.isInteger(pairs) || pairs < 1) throw new RangeError('pairs must be an integer >= 1');
  const t = Math.min(1, (level - 1) / (PAR.tightestLevel - 1));
  const base = PAR.baseStartMs + (PAR.baseEndMs - PAR.baseStartMs) * t;
  return Math.round(PAR.fixedMs + pairs * (base + PAR.scanMsPerPair * (pairs + 1)));
}

export function scoringFor(level: number, pairs: number): ScoringConfig {
  const [one, two, three] = POINTS.starShares;
  return {
    basePoints: POINTS.basePoints,
    parMs: parMsFor(level, pairs),
    overrunFactor: POINTS.overrunFactor,
    mistakePenalty: POINTS.mistakePenalty,
    hintPenalty: POINTS.hintPenalty,
    comboBonus: POINTS.comboBonus,
    starThresholds: [
      Math.round(POINTS.basePoints * one),
      Math.round(POINTS.basePoints * two),
      Math.round(POINTS.basePoints * three),
    ],
  };
}

/** Reference config for a mid board (level 60, 8 pairs); `GameDefinition.scoring` default. */
export const juftScoring: ScoringConfig = scoringFor(60, 8);

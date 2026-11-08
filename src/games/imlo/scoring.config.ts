/**
 * Imlo scoring parameters. Numbers only: the formulas live in `core/scoring`. Par time is built from what the
 * player does (one tap per letter, a search over the bank for each tap, one check per pair), so longer words and
 * bigger banks (Qiyin's distractors) earn a longer par, and it tightens with the level. Validated by simulation:
 * see `docs/games/06-imlo-balance.md`.
 */
import type { ScoringConfig } from '../../core/scoring/index.ts';
import type { GameSettings, LevelSpec } from '../types.ts';
import type { ImloMode, ImloParams } from './levels.ts';

export const PAR = {
  /** Time to read the first clue before the first tap. */
  fixedMs: 1000,
  /** Per pair: read the clue, press the check star, watch the next pair slide in. */
  perPairMs: 1200,
  /** Per letter tile placed. */
  tapMs: 520,
  /** Extra ms per tile in the bank, paid on every tap (visual search). */
  scanMsPerTile: 38,
  /** Par at the last level as a share of par at level 1; linear between. */
  tightestShare: 0.95,
  tightestLevel: 60,
} as const;

export const POINTS = {
  basePoints: 1000,
  overrunFactor: 3,
  /** A wrong check; it also costs a life. */
  mistakePenalty: 100,
  hintPenalty: 150,
  comboBonus: 10,
  /** Stars as shares of `basePoints` (1, 2, 3 stars). */
  starShares: [0.25, 0.6, 0.9],
} as const;

/** Score multiplier per difficulty mode (docs/games/06-imlo.md). */
export const MODE_MULTIPLIER: Record<ImloMode, number> = { oson: 1, orta: 1.25, qiyin: 1.5 };

/** Score multiplier for reading the Uzbek side in Cyrillic (the labelled hard mode, as in Juft). */
export const CYRILLIC_MULTIPLIER = 1.2;

/** `GameDefinition.multipliers`: the mode's, plus Cyrillic's when the player reads Uzbek in Cyrillic. */
export function imloMultipliers(settings: GameSettings, mode: string = 'oson'): readonly number[] {
  const byMode = MODE_MULTIPLIER[mode as ImloMode] ?? 1;
  return settings.script === 'cyrl' ? [byMode, CYRILLIC_MULTIPLIER] : [byMode];
}

/** Par for one pair: a tap per letter on both sides, each paying a scan over the bank, plus the check. */
export function pairParMs(letters: number, bankSize: number): number {
  return PAR.perPairMs + letters * (PAR.tapMs + PAR.scanMsPerTile * bankSize);
}

export function parMsFor(
  level: number,
  pairs: readonly { letters: number; bank: number }[],
): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError('level must be an integer >= 1');
  if (pairs.length < 1) throw new RangeError('a level needs at least one pair');
  const t = Math.min(1, (level - 1) / (PAR.tightestLevel - 1));
  const tighten = 1 - (1 - PAR.tightestShare) * t;
  const total = pairs.reduce((sum, p) => sum + pairParMs(p.letters, p.bank), 0);
  return Math.round((PAR.fixedMs + total) * tighten);
}

export function scoringFor(spec: LevelSpec<ImloParams>): ScoringConfig {
  const [one, two, three] = POINTS.starShares;
  return {
    basePoints: POINTS.basePoints,
    parMs: parMsFor(
      spec.level,
      spec.params.pairs.map((p) => ({
        letters: p.source.letters.length + p.uz.letters.length,
        bank: p.bank.length,
      })),
    ),
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

/** Reference config for a late board (level 60, 8 pairs of 8 + 8 letters, 20 tiles); `GameDefinition.scoring` default. */
export const imloScoring: ScoringConfig = (() => {
  const [one, two, three] = POINTS.starShares;
  return {
    basePoints: POINTS.basePoints,
    parMs: parMsFor(
      60,
      Array.from({ length: 8 }, () => ({ letters: 16, bank: 20 })),
    ),
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
})();

/**
 * Balance harness for Juft: a `GameDefinition` built from the real rules and scoring config, driven through
 * `toSimGame`. The level shape (pairs, transparency) is a stand-in for E1's generator and content: it follows
 * the curve in `docs/games/01-juft.md`. Sim-only; the shipped game never imports this.
 */
import type { ComponentType } from 'react';
import { createRng, type Rng } from '../../core/random/index.ts';
import type { GameEvent } from '../../core/session/index.ts';
import type { SimGame } from '../../core/sim/index.ts';
import { toSimGame } from '../sim-adapter.ts';
import type { BoardProps, GameDefinition, GameSettings } from '../types.ts';
import { createJuftRules, type JuftAction, type JuftEvent, type JuftState } from './rules.ts';
import { scoringFor } from './scoring.config.ts';

/** Pairs at the first and last level of each 15-level chapter (docs/games/01-juft.md). */
const CHAPTERS: readonly (readonly [number, number])[] = [
  [1, 4],
  [4, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [12, 12],
];
export const MAX_PAIRS = 12;
export const COUNTDOWN_MS = 3000;

/** Every 5th level is a one-pair "hard pair" breather. */
export function isHardPair(level: number): boolean {
  return level % 5 === 0;
}

export function pairsForLevel(level: number): number {
  if (isHardPair(level)) return 1;
  const chapter = Math.min(CHAPTERS.length - 1, Math.floor((level - 1) / 15));
  const [from, to] = CHAPTERS[chapter]!;
  const t = ((level - 1) % 15) / 14;
  return Math.min(MAX_PAIRS, Math.round(from + (to - from) * t));
}

/** (level, transparency) anchors; linear between, flat after the last. */
const TRANSPARENCY: readonly (readonly [number, number])[] = [
  [1, 0.95],
  [5, 0.93],
  [10, 0.6],
  [30, 0.4],
  [60, 0.6],
  [120, 0.7],
];

/**
 * Assumed share of the board a player recognises (what the sim's accuracy curve is indexed by): chapter 1 is
 * very transparent, the next chapters introduce opaque cognates, and later boards lean on frequency-ranked
 * loans again while par tightens. A stand-in for the content mix E1 will deal.
 */
export function transparencyForLevel(level: number): number {
  if (isHardPair(level)) return 0.3;
  const last = TRANSPARENCY[TRANSPARENCY.length - 1]!;
  if (level >= last[0]) return last[1];
  const i = TRANSPARENCY.findIndex(([l]) => l > level);
  const [l0, t0] = TRANSPARENCY[Math.max(0, i - 1)]!;
  const [l1, t1] = TRANSPARENCY[i]!;
  return t0 + ((t1 - t0) * (level - l0)) / (l1 - l0);
}

interface Params {
  pairIds: readonly string[];
}

export function juftSimDefinition(
  level: number,
): GameDefinition<Params, JuftState, JuftAction, JuftEvent> {
  const pairs = pairsForLevel(level);
  return {
    id: 'juft',
    title: { uzLatn: 'Juft', uzCyrl: 'Жуфт' },
    levels: (ctx) => ({
      level: ctx.level,
      seed: ctx.seed,
      lives: 3,
      params: { pairIds: Array.from({ length: pairs }, (_, i) => `p${i}`) },
    }),
    createRules: (spec, attemptRng: Rng) =>
      createJuftRules({ pairIds: spec.params.pairIds, rng: attemptRng }),
    scoring: scoringFor(level, pairs),
    difficulty: { params: {} },
    Board: (() => null) as ComponentType<BoardProps<Params, JuftState, JuftAction, JuftEvent>>,
  };
}

const SETTINGS: GameSettings = { sourceLangs: ['tr'], script: 'latn' };

/**
 * One SimGame per level (par and stars depend on the level). The bot alternates a free tap on a left tile
 * with the deciding tap on the right column; only the deciding tap can be wrong, and the scan time covers
 * every tile still on screen.
 */
export function juftSimGame(level: number): SimGame<JuftState, JuftAction> {
  const def = juftSimDefinition(level);
  return toSimGame(def as GameDefinition<Params, JuftState, JuftAction, GameEvent>, {
    settings: SETTINGS,
    history: [],
    countdownMs: COUNTDOWN_MS,
    nextStep(state, lvl, rng) {
      const open = state.left.filter((id) => !state.matched.includes(id));
      const choices = open.length * 2;
      if (!state.selected) {
        const tileId = open[Math.floor(rng.next() * open.length)]!;
        const tap: JuftAction = { type: 'select', side: 'left', tileId };
        return { transparency: 1, correct: tap, wrong: tap, choices };
      }
      const target = state.selected.tileId;
      const others = open.filter((id) => id !== target);
      const wrongId = others.length ? others[Math.floor(rng.next() * others.length)]! : target;
      return {
        transparency: transparencyForLevel(lvl),
        correct: { type: 'select', side: 'right', tileId: target },
        wrong: { type: 'select', side: 'right', tileId: wrongId },
        choices,
      };
    },
  });
}

export { createRng };

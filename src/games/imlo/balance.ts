/**
 * Balance harness for Imlo: a `GameDefinition` built from the real rules and scoring config, driven through
 * `toSimGame`. Pair content is a synthetic stand-in for I2's generator (word lengths and bank sizes follow the
 * difficulty config; letters are placeholders), so the sim never needs the content files. Sim-only; the shipped
 * game never imports this. Relative imports only: `scripts/sim.ts` runs it under plain Node.
 */
import type { ComponentType } from 'react';
import { paramsFor } from '../../core/difficulty/index.ts';
import type { Rng } from '../../core/random/index.ts';
import type { GameEvent } from '../../core/session/index.ts';
import type { SimGame, SimProfile } from '../../core/sim/index.ts';
import { toSimGame } from '../sim-adapter.ts';
import type { BoardProps, GameDefinition, GameSettings, LevelSpec } from '../types.ts';
import { LEVEL_COUNT, LIVES, MIN_LETTERS, imloDifficulty } from './difficulty.config.ts';
import type { BankTile, ImloMode, ImloPair, ImloParams } from './levels.ts';
import { createImloRules, type ImloAction, type ImloEvent, type ImloState } from './rules.ts';
import { MODE_MULTIPLIER, scoringFor } from './scoring.config.ts';

export const COUNTDOWN_MS = 3000;

/**
 * Spelling player models. A step is one tile tap, so these are per-tap times, not Juft's per-decision times.
 * `accuracy` applies to the tap that decides a "hard" letter (where Uzbek departs from the source spelling);
 * every other tap is free. `scanMsPerChoice` is paid per tile still in the bank.
 */
export const IMLO_PROFILES: Record<string, SimProfile> = {
  novice: {
    name: 'novice',
    accuracy: { low: 0.4, high: 0.9 },
    responseMs: { median: 1400, spread: 0.35 },
    scanMsPerChoice: 90,
  },
  'b1-turkish': {
    name: 'b1-turkish',
    accuracy: { low: 0.6, high: 0.97 },
    responseMs: { median: 900, spread: 0.3 },
    scanMsPerChoice: 55,
  },
  expert: {
    name: 'expert',
    accuracy: { low: 0.85, high: 0.995 },
    responseMs: { median: 550, spread: 0.25 },
    scanMsPerChoice: 25,
  },
};

/** Assumed recognition of a hard letter: (level, value) anchors, linear between, flat after the last. */
const HARD_LETTER: readonly (readonly [number, number])[] = [
  [1, 0.97],
  [15, 0.93],
  [30, 0.88],
  [45, 0.84],
  [60, 0.8],
];
/** Each distractor in the bank removes this much recognition (Qiyin only). */
const DISTRACTOR_COST = 0.02;

export function hardLetterTransparency(level: number, distractors: number): number {
  const last = HARD_LETTER[HARD_LETTER.length - 1]!;
  let base = last[1];
  if (level < last[0]) {
    const i = HARD_LETTER.findIndex(([l]) => l > level);
    const [l0, t0] = HARD_LETTER[Math.max(0, i - 1)]!;
    const [l1, t1] = HARD_LETTER[i]!;
    base = t0 + ((t1 - t0) * (level - l0)) / (l1 - l0);
  }
  return Math.min(1, Math.max(0.05, base - DISTRACTOR_COST * distractors));
}

const BASE_LETTERS = 'abdeghiklmnoprstuz';
/** Uzbek-side replacements for hard letters; none is in `BASE_LETTERS`, so a hard slot's letter is unambiguous. */
const HARD_LETTERS = 'qxwy';
/** Distractors; none is in either set above. */
const DISTRACTOR_LETTERS = 'cfjv';

interface SynthPair extends ImloPair {
  /** Uzbek-side slot indexes that are hard letters. */
  hard: readonly number[];
}

/** Hard letters per word: 1 early, up to 4 in the last chapter (suffixed forms and opaque cognates). */
const hardCount = (level: number) => 1 + Math.floor((level - 1) / 15);

function synthPairs(level: number, mode: ImloMode): SynthPair[] {
  const p = paramsFor(level, imloDifficulty);
  const span = p.maxLetters - p.minLetters + 1;
  const extra = mode === 'qiyin' ? Math.max(0, p.distractors) : 0;
  return Array.from({ length: Math.max(1, p.pairs) }, (_, k) => {
    const srcLen = p.minLetters + ((k * 3 + level) % span);
    const uzLen = Math.max(MIN_LETTERS, k % 2 === 0 ? srcLen - 1 : srcLen);
    const src = Array.from({ length: srcLen }, (_, i) => BASE_LETTERS[(k * 5 + i * 3) % 18]!);
    const hard = Array.from(
      new Set(
        Array.from({ length: Math.min(hardCount(level), uzLen) }, (_, j) => (1 + 2 * j) % uzLen),
      ),
    );
    const uz = Array.from({ length: uzLen }, (_, i) =>
      hard.includes(i)
        ? HARD_LETTERS[hard.indexOf(i) % 4]!
        : (src[i] ?? BASE_LETTERS[(k + i) % 18]!),
    );
    const tiles: BankTile[] = [
      ...src.map((letter, i) => ({ id: `s${i}`, letter, origin: 'source' as const })),
      ...uz.map((letter, i) => ({ id: `u${i}`, letter, origin: 'uz' as const })),
      ...Array.from({ length: extra }, (_, i) => ({
        id: `d${i}`,
        letter: DISTRACTOR_LETTERS[i % 4]!,
        origin: 'distractor' as const,
      })),
    ];
    return {
      itemId: `synth${k}`,
      clue: '',
      source: { lang: 'tr', text: src.join(''), letters: src },
      uz: { text: uz.join(''), letters: uz },
      bank: tiles,
      hard,
    };
  });
}

interface Level {
  spec: LevelSpec<ImloParams>;
  pairs: SynthPair[];
}

function buildLevel(level: number, mode: ImloMode): Level {
  const pairs = synthPairs(level, mode);
  return {
    pairs,
    spec: { level, seed: `imlo-balance:${mode}:${level}`, lives: LIVES, params: { pairs, mode } },
  };
}

export function imloSimDefinition(
  level: number,
  mode: ImloMode,
): GameDefinition<ImloParams, ImloState, ImloAction, ImloEvent> {
  const built = buildLevel(level, mode);
  return {
    id: mode === 'oson' ? 'imlo' : `imlo-${mode}`,
    title: { uzLatn: 'Imlo', uzCyrl: 'Имло' },
    levels: () => built.spec,
    createRules: (spec, attemptRng: Rng) =>
      createImloRules({ pairs: spec.params.pairs, rng: attemptRng }),
    // The sim applies no `multipliers`, so fold the mode's into the config (score is linear in them).
    scoring: scaled(scoringFor(built.spec), MODE_MULTIPLIER[mode]),
    difficulty: imloDifficulty,
    Board: (() => null) as ComponentType<BoardProps<ImloParams, ImloState, ImloAction, ImloEvent>>,
  };
}

function scaled<T extends ReturnType<typeof scoringFor>>(c: T, m: number): T {
  return {
    ...c,
    basePoints: c.basePoints * m,
    mistakePenalty: c.mistakePenalty * m,
    hintPenalty: c.hintPenalty * m,
    comboBonus: c.comboBonus * m,
  };
}

const SETTINGS: GameSettings = { sourceLangs: ['tr'], script: 'latn' };

/**
 * One SimGame per (level, mode). The bot places the next tile of the active side: easy letters are free taps,
 * a hard letter is the decision (right tile or a tempting wrong one). It checks when every slot is full, and
 * after a wrong check takes the wrong slots back out and decides them again.
 */
export function imloSimGame(level: number, mode: ImloMode): SimGame<ImloState, ImloAction> {
  const def = imloSimDefinition(level, mode);
  const { pairs } = buildLevel(level, mode);
  const distractors = pairs[0]!.bank.filter((t) => t.origin === 'distractor').length;
  return toSimGame(def as GameDefinition<ImloParams, ImloState, ImloAction, GameEvent>, {
    settings: SETTINGS,
    history: [],
    countdownMs: COUNTDOWN_MS,
    nextStep(state) {
      const pair = pairs[state.pair]!;
      const letter = (id: string | null) => pair.bank.find((t) => t.id === id)?.letter;
      const placed = new Set([...state.slots.source, ...state.slots.uz]);
      const choices = pair.bank.filter((t) => !placed.has(t.id)).length;
      const free = (a: ImloAction) => ({ transparency: 1, correct: a, wrong: a, choices });

      const wrongSlot = (): ImloAction | undefined => {
        for (const side of ['source', 'uz'] as const) {
          const slot = state.slots[side].findIndex(
            (id, i) => id !== null && letter(id) !== pair[side].letters[i],
          );
          if (slot >= 0) return { type: 'remove', side, slot };
        }
        return undefined;
      };
      // After a wrong check the wrong slots come back out and get decided again.
      const back = state.checks > 0 ? wrongSlot() : undefined;
      if (back) return free(back);
      const side = state.active;
      const slot = state.slots[side].indexOf(null);
      if (slot < 0) return free({ type: 'check' });

      const expected = pair[side].letters[slot]!;
      const bank = pair.bank.filter((t) => !placed.has(t.id));
      const right = bank.find((t) => t.letter === expected);
      // A wrong tap used up the tile this slot needs: take the wrong slot back out.
      if (!right) return free(wrongSlot()!);
      const counterpart = pair.source.letters[slot];
      const tempting =
        bank.find((t) => t.letter === counterpart && t.letter !== expected) ??
        bank.find((t) => t.origin === 'distractor') ??
        bank.find((t) => t.letter !== expected);
      const correct: ImloAction = { type: 'place', tileId: right.id };
      if (side === 'source' || !pair.hard.includes(slot) || !tempting) return free(correct);
      return {
        transparency: hardLetterTransparency(level, distractors),
        correct,
        wrong: { type: 'place', tileId: tempting.id },
        choices,
      };
    },
  });
}

export { LEVEL_COUNT };

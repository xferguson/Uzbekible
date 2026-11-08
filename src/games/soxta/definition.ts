/**
 * The Soxta `GameDefinition`: wires the card pool, swipe rules, difficulty and board into the shared shell
 * contract. Soxta is endless (one run, no map), so it declares `endless` and the shell hosts it as level 1.
 */
import type { Item } from '@core/content/index.ts';
import type { LogEventInput } from '@core/learning-log/index.ts';
import type { GameEvent } from '@core/session/index.ts';
import { registerGame } from '../registry.ts';
import type { GameDefinition, LevelSpec } from '../types.ts';
import { Board, REVEAL_MS } from './Board.tsx';
import { soxtaPool, type Card } from './cards.ts';
import { Sample } from './Sample.tsx';
import { cardScoring, LIVES, soxtaDifficulty } from './config.ts';
import { createSoxtaRules, type SoxtaAction, type SoxtaEvent, type SoxtaState } from './rules.ts';

export interface SoxtaParams {
  cards: readonly Card[];
}

export type SoxtaDefinition = GameDefinition<SoxtaParams, SoxtaState, SoxtaAction, SoxtaEvent>;

export function createSoxtaDefinition(items: readonly Item[]): SoxtaDefinition {
  // v1 has Turkish false friends only, so the player's source-language setting does not change the pool.
  const cards = soxtaPool(items);
  const byId = new Map(cards.map((c) => [c.id, c]));

  function logEvents(
    _spec: LevelSpec<SoxtaParams>,
    event: GameEvent,
    rtMs: number,
  ): LogEventInput[] {
    const e = event as SoxtaEvent;
    if (e.type !== 'swipeCorrect' && e.type !== 'swipeWrong' && e.type !== 'timeout') return [];
    const card = byId.get(e.itemId);
    if (!card) return [];
    const sourceLang = card.other.lang;
    if (e.type === 'timeout')
      return [{ type: 'swipe_timeout', gameId: 'soxta', itemId: e.itemId, sourceLang, rtMs }];
    // The uz word sits on the clue's side when the clue is Uzbek; the swipe names the word it picked.
    const picked = e.type === 'swipeWrong' ? e.reveal.picked : e.clue === 'uz' ? 'uz' : 'other';
    return [
      {
        type: e.type === 'swipeCorrect' ? 'swipe_correct' : 'swipe_wrong',
        gameId: 'soxta',
        itemId: e.itemId,
        sourceLang,
        side: picked === 'uz' ? 'uz' : 'source',
        rtMs,
      },
    ];
  }

  return {
    id: 'soxta',
    title: { uzLatn: 'Soxta', uzCyrl: 'Сохта' },
    levels: ({ level, seed }) => ({ level, seed, lives: LIVES, params: { cards } }),
    createRules: (spec, attemptRng) =>
      createSoxtaRules({ cards: spec.params.cards, rng: attemptRng }),
    scoring: cardScoring,
    logEvents,
    difficulty: soxtaDifficulty,
    endless: {
      intro: {
        kicker: 'Game 5 · False friends',
        blurb:
          'Two words look alike. One clue gives a meaning. Swipe toward the word that really has it. Three cracks end the run.',
        Sample,
      },
      summary: (g) => ({
        score: g.score,
        streak: g.bestStreak,
        correct: g.correct,
        mistakes: g.mistakes,
        missed: g.missed.flatMap((id) => {
          const c = byId.get(id);
          if (!c) return [];
          return [
            {
              id,
              uz: c.uz.uz,
              uzMeaning: c.clues.uz,
              source: { lang: c.other.lang, text: c.other.text },
              ...(c.clues.other !== undefined && { sourceMeaning: c.clues.other }),
            },
          ];
        }),
      }),
      holdMs: REVEAL_MS,
    },
    Board,
  };
}

/** Registers Soxta with the shell (once; the pack is loaded by the app). */
export function registerSoxta(items: readonly Item[]): SoxtaDefinition {
  const def = createSoxtaDefinition(items);
  registerGame(def);
  return def;
}

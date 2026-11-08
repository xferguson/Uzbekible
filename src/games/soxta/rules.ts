/**
 * Soxta swipe rules: a pure reducer for `core/session`. Each card shows the Uzbek word and the Turkish word on
 * opposite sides with one English clue between them; the player swipes toward the word the clue belongs to.
 * Lives are the session's job: a wrong swipe or a timeout emits one `mistake` and one `lifeLost`.
 *
 * The clue kind decides which swipe is right (`ANSWERS`). v1 has two kinds, `uz` and `other`; a "both fit"
 * control card is one more kind and one more table entry, with the same state and action shapes.
 */
import { paramsFor } from '../../core/difficulty/index.ts';
import { shuffle, weightedPick, type Rng } from '../../core/random/index.ts';
import { score } from '../../core/scoring/index.ts';
import type { Rules, RulesEvent } from '../../core/session/index.ts';
import type { Card } from './cards.ts';
import {
  cardScoring,
  LIVES,
  RESURFACE_EVERY,
  soxtaDifficulty,
  streakMultiplier,
} from './config.ts';

export type Side = 'left' | 'right';
export type ClueKind = 'uz' | 'other';

export type SoxtaAction = { type: 'swipe'; side: Side } | { type: 'tick'; ms: number };

export interface SoxtaClue {
  kind: ClueKind;
  text: string;
}

export interface SoxtaCurrent {
  card: Card;
  /** Side the Uzbek word sits on; the Turkish word is on the other. */
  uzSide: Side;
  clue: SoxtaClue;
  remainingMs: number;
}

export interface SoxtaState {
  current: SoxtaCurrent;
  streak: number;
  bestStreak: number;
  score: number;
  /** Wrong swipes and timeouts so far. */
  mistakes: number;
  /** Correct swipes so far. */
  correct: number;
  /** Ids of cards missed and not yet answered correctly, oldest first. */
  missed: readonly string[];
  /** Cards drawn so far (drives the resurface rhythm). */
  drawn: number;
  over: boolean;
}

export type SoxtaEvent =
  | {
      type: 'swipeCorrect';
      itemId: string;
      side: Side;
      clue: ClueKind;
      points: number;
      streak: number;
    }
  | {
      type: 'swipeWrong';
      itemId: string;
      side: Side;
      clue: ClueKind;
      /** What the word the player picked actually means, for the reveal. */
      reveal: { picked: 'uz' | 'other'; gloss: string | undefined };
    }
  | { type: 'timeout'; itemId: string; clue: ClueKind };

type Ev = RulesEvent<SoxtaEvent>;

/** Which side is right for each clue kind, given where the Uzbek word sits. */
const ANSWERS: Record<ClueKind, (uzSide: Side) => Side> = {
  uz: (uzSide) => uzSide,
  other: (uzSide) => opposite(uzSide),
};

const opposite = (s: Side): Side => (s === 'left' ? 'right' : 'left');

export interface SoxtaRulesOptions {
  cards: readonly Card[];
  rng: Rng;
  lives?: number;
}

export const cardMsFor = (streak: number): number => paramsFor(streak, soxtaDifficulty).cardMs;

/** The side of the screen the right answer is on. */
export const correctSide = (c: Pick<SoxtaCurrent, 'uzSide' | 'clue'>): Side =>
  ANSWERS[c.clue.kind](c.uzSide);

export function createSoxtaRules({
  cards,
  rng,
  lives = LIVES,
}: SoxtaRulesOptions): Rules<SoxtaState, SoxtaAction, SoxtaEvent> {
  if (cards.length === 0) throw new RangeError('createSoxtaRules: need at least one card');
  const byId = new Map(cards.map((c) => [c.id, c]));
  /** Easier tiers first; shuffled within a tier. Refilled when it runs dry. */
  const fill = (): Card[] =>
    [1, 2, 3].flatMap((tier) =>
      shuffle(
        rng,
        cards.filter((c) => c.tier === tier),
      ),
    );
  let queue = fill();

  const draw = (
    drawn: number,
    missed: readonly string[],
    streak: number,
    avoid?: string,
  ): SoxtaCurrent => {
    let card: Card | undefined;
    const due = (drawn + 1) % RESURFACE_EVERY === 0;
    const back = missed.filter((id) => id !== avoid);
    if (due && back.length > 0) {
      const pick = weightedPick(
        rng,
        back,
        back.map((_, i) => i + 1),
      );
      card = byId.get(pick);
    }
    if (!card) {
      if (queue.length === 0) queue = fill();
      // Skip a card equal to the one just shown when another is available.
      const i = queue.findIndex((c) => c.id !== avoid);
      [card] = queue.splice(i < 0 ? 0 : i, 1);
    }
    const chosen = card!;
    const kinds: ClueKind[] = chosen.clues.other === undefined ? ['uz'] : ['uz', 'other'];
    const kind = kinds[rng.int(0, kinds.length - 1)]!;
    const uzSide: Side = rng.next() < 0.5 ? 'left' : 'right';
    return {
      card: chosen,
      uzSide,
      clue: {
        kind,
        text: (kind === 'uz' ? chosen.clues.uz : chosen.clues.other) ?? chosen.clues.uz,
      },
      remainingMs: cardMsFor(streak),
    };
  };

  const first = draw(0, [], 0);
  const init: SoxtaState = {
    current: first,
    streak: 0,
    bestStreak: 0,
    score: 0,
    mistakes: 0,
    correct: 0,
    missed: [],
    drawn: 1,
    over: false,
  };

  /** Shared tail of a wrong swipe and a timeout. */
  const fail = (state: SoxtaState, event: SoxtaEvent): { state: SoxtaState; events: Ev[] } => {
    const id = state.current.card.id;
    const missed = state.missed.includes(id) ? state.missed : [...state.missed, id];
    const mistakes = state.mistakes + 1;
    const over = mistakes >= lives;
    const events: Ev[] = [event, { type: 'mistake' }, { type: 'lifeLost' }];
    const next = over ? undefined : draw(state.drawn, missed, 0, id);
    return {
      state: {
        ...state,
        streak: 0,
        mistakes,
        missed,
        over,
        drawn: over ? state.drawn : state.drawn + 1,
        current: next ?? state.current,
      },
      events,
    };
  };

  return {
    init,
    reduce(state, action) {
      if (state.over) return { state, events: [] };
      const { current } = state;

      if (action.type === 'tick') {
        if (!(action.ms > 0)) return { state, events: [] };
        const remainingMs = current.remainingMs - action.ms;
        if (remainingMs > 0)
          return { state: { ...state, current: { ...current, remainingMs } }, events: [] };
        return fail(state, { type: 'timeout', itemId: current.card.id, clue: current.clue.kind });
      }

      const id = current.card.id;
      if (action.side === correctSide(current)) {
        const streak = state.streak + 1;
        const points = score(
          {
            timeMs: 0,
            mistakes: 0,
            hints: 0,
            combos: 0,
            multipliers: [streakMultiplier(state.streak)],
          },
          cardScoring,
        );
        const missed = state.missed.filter((m) => m !== id);
        const next = draw(state.drawn, missed, streak, id);
        const events: Ev[] = [
          {
            type: 'swipeCorrect',
            itemId: id,
            side: action.side,
            clue: current.clue.kind,
            points,
            streak,
          },
        ];
        if (streak >= 2) events.push({ type: 'combo' });
        return {
          state: {
            ...state,
            streak,
            bestStreak: Math.max(state.bestStreak, streak),
            score: state.score + points,
            correct: state.correct + 1,
            missed,
            drawn: state.drawn + 1,
            current: next,
          },
          events,
        };
      }

      const picked: 'uz' | 'other' = action.side === current.uzSide ? 'uz' : 'other';
      return fail(state, {
        type: 'swipeWrong',
        itemId: id,
        side: action.side,
        clue: current.clue.kind,
        reveal: {
          picked,
          gloss: picked === 'uz' ? current.card.clues.uz : current.card.clues.other,
        },
      });
    },
  };
}

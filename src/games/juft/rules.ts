/**
 * Juft match rules: a pure reducer for `core/session`. Both columns hold the same pair ids (a tile's id is its
 * pair's id), so two tiles match exactly when their ids are equal.
 */
import { shuffle, type Rng } from '../../core/random';
import type { Rules, RulesEvent } from '../../core/session';

export type Side = 'left' | 'right';

export type JuftAction =
  { type: 'select'; side: Side; tileId: string } | { type: 'hint'; tileId: string };

export interface JuftState {
  /** Tile ids top to bottom, shuffled on level start. Matched tiles stay in place (their sockets remain). */
  left: readonly string[];
  right: readonly string[];
  selected: { side: Side; tileId: string } | null;
  /** Matched pair ids in match order. */
  matched: readonly string[];
  /** Consecutive correct matches; reset by a mistake. */
  combo: number;
}

/** Juft's own events, for the board UI. The standard events (`mistake`, `lifeLost`, `combo`, `hint`) ride alongside. */
export type JuftEvent =
  | { type: 'selected'; side: Side; tileId: string }
  | { type: 'deselected'; side: Side; tileId: string }
  | { type: 'matched'; tileId: string; combo: number }
  | { type: 'mismatched'; leftId: string; rightId: string }
  | { type: 'hintShown'; tileId: string };

type Ev = RulesEvent<JuftEvent>;

export interface JuftOptions {
  pairIds: readonly string[];
  rng: Rng;
}

export function createJuftRules({
  pairIds,
  rng,
}: JuftOptions): Rules<JuftState, JuftAction, JuftEvent> {
  if (pairIds.length === 0) throw new RangeError('createJuftRules: need at least one pair');
  if (new Set(pairIds).size !== pairIds.length)
    throw new RangeError('createJuftRules: duplicate pair ids');

  const init: JuftState = {
    left: shuffle(rng, pairIds),
    right: shuffle(rng, pairIds),
    selected: null,
    matched: [],
    combo: 0,
  };
  const none = (state: JuftState) => ({ state, events: [] as Ev[] });

  return {
    init,
    reduce(state, action) {
      if (!pairIds.includes(action.tileId) || state.matched.includes(action.tileId))
        return none(state);

      if (action.type === 'hint') {
        return { state, events: [{ type: 'hintShown', tileId: action.tileId }, { type: 'hint' }] };
      }

      const { side, tileId } = action;
      const sel = state.selected;
      if (!sel) {
        return {
          state: { ...state, selected: { side, tileId } },
          events: [{ type: 'selected', side, tileId }],
        };
      }
      if (sel.side === side) {
        const events: Ev[] = [{ type: 'deselected', side, tileId: sel.tileId }];
        if (sel.tileId === tileId) return { state: { ...state, selected: null }, events };
        events.push({ type: 'selected', side, tileId });
        return { state: { ...state, selected: { side, tileId } }, events };
      }

      // Cross-column pair.
      if (sel.tileId === tileId) {
        const matched = [...state.matched, tileId];
        const combo = state.combo + 1;
        const events: Ev[] = [{ type: 'matched', tileId, combo }, { type: 'combo' }];
        if (matched.length === pairIds.length) events.push({ type: 'complete' });
        return { state: { ...state, selected: null, matched, combo }, events };
      }
      const leftId = side === 'right' ? sel.tileId : tileId;
      const rightId = side === 'right' ? tileId : sel.tileId;
      return {
        state: { ...state, selected: null, combo: 0 },
        events: [
          { type: 'mismatched', leftId, rightId },
          { type: 'mistake' },
          { type: 'lifeLost' },
        ],
      };
    },
  };
}

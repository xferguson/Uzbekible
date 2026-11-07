/**
 * Imlo spelling rules for one level: a pure reducer for `core/session`. Each pair has two rows of slots (the
 * source word and the Uzbek word) and one shared bank. Correctness is by letter value, never tile id. Lives are
 * the session's job: a wrong check emits one `lifeLost`, however many sides are wrong.
 */
import { shuffle, type Rng } from '../../core/random/index.ts';
import type { Rules, RulesEvent } from '../../core/session/index.ts';
import type { ImloPair } from './levels.ts';

export type Side = 'source' | 'uz';

export type ImloAction =
  | { type: 'selectSide'; side: Side }
  | { type: 'place'; tileId: string }
  | { type: 'remove'; side: Side; slot: number }
  | { type: 'check' }
  | { type: 'hint'; side: Side; slot: number };

export interface SideSlots<T> {
  source: readonly T[];
  uz: readonly T[];
}

export interface ImloState {
  /** Index of the current pair; `pairs.length` once the level is complete. */
  pair: number;
  active: Side;
  /** Tile id in each slot of the current pair, or null. A tile outside every slot is in the bank. */
  slots: SideSlots<string | null>;
  /** Hinted slots: filled with the correct letter and not removable. */
  locked: SideSlots<boolean>;
  /** Shuffled tile ids per pair (a fresh shuffle each attempt); the bank shows them in this order. */
  banks: readonly (readonly string[])[];
  /** Checks made on the current pair. */
  checks: number;
  /** Hints used on the current pair. */
  hints: number;
}

export type ImloEvent =
  | { type: 'placed'; side: Side; slot: number; tileId: string }
  | { type: 'removed'; side: Side; slot: number; tileId: string }
  | { type: 'spellCorrect'; itemId: string; checks: number; hints: number }
  | { type: 'spellWrong'; itemId: string; side: Side; given: string; expected: string }
  | { type: 'hintUsed'; itemId: string; side: Side; slot: number };

type Ev = RulesEvent<ImloEvent>;

export interface ImloRulesOptions {
  pairs: readonly ImloPair[];
  rng: Rng;
}

const SIDES: readonly Side[] = ['source', 'uz'];
const other = (side: Side): Side => (side === 'source' ? 'uz' : 'source');

function emptyFor(pair: ImloPair): Pick<ImloState, 'slots' | 'locked'> {
  const n = (side: Side) => pair[side].letters.length;
  const blank = <T>(v: T): SideSlots<T> => ({
    source: Array<T>(n('source')).fill(v),
    uz: Array<T>(n('uz')).fill(v),
  });
  return { slots: blank<string | null>(null), locked: blank(false) };
}

const withSlot = <T>(row: readonly T[], i: number, v: T): T[] =>
  row.map((x, j) => (j === i ? v : x));

export function createImloRules({
  pairs,
  rng,
}: ImloRulesOptions): Rules<ImloState, ImloAction, ImloEvent> {
  if (pairs.length === 0) throw new RangeError('createImloRules: need at least one pair');

  const init: ImloState = {
    pair: 0,
    active: 'source',
    ...emptyFor(pairs[0]!),
    banks: pairs.map((p) =>
      shuffle(
        rng,
        p.bank.map((t) => t.id),
      ),
    ),
    checks: 0,
    hints: 0,
  };
  const none = (state: ImloState) => ({ state, events: [] as Ev[] });

  /** Letter of a tile id in a pair's bank. */
  const letterOf = (pair: ImloPair, id: string | null): string | undefined =>
    id === null ? undefined : pair.bank.find((t) => t.id === id)?.letter;

  /** After a slot fills: if its side is full, the other side becomes active when it has gaps. */
  const nextActive = (state: ImloState, side: Side): Side => {
    if (
      state.slots[side].every((s) => s !== null) &&
      state.slots[other(side)].some((s) => s === null)
    )
      return other(side);
    return side;
  };

  /** Put `tileId` in `slot` of `side`, taking it out of any slot it sits in. */
  const put = (state: ImloState, side: Side, slot: number, tileId: string): ImloState => {
    const slots: SideSlots<string | null> = {
      source: state.slots.source.map((s) => (s === tileId ? null : s)),
      uz: state.slots.uz.map((s) => (s === tileId ? null : s)),
    };
    slots[side] = withSlot(slots[side], slot, tileId);
    return { ...state, slots };
  };

  return {
    init,
    reduce(state, action) {
      const pair = pairs[state.pair];
      if (!pair) return none(state);

      switch (action.type) {
        case 'selectSide': {
          if (action.side === state.active) return none(state);
          return { state: { ...state, active: action.side }, events: [] };
        }

        case 'place': {
          if (!pair.bank.some((t) => t.id === action.tileId)) return none(state);
          if ([...state.slots.source, ...state.slots.uz].includes(action.tileId))
            return none(state);
          const side = state.active;
          const slot = state.slots[side].indexOf(null);
          if (slot < 0) return none(state);
          const placed = put(state, side, slot, action.tileId);
          return {
            state: { ...placed, active: nextActive(placed, side) },
            events: [{ type: 'placed', side, slot, tileId: action.tileId }],
          };
        }

        case 'remove': {
          const { side, slot } = action;
          const tileId = state.slots[side][slot];
          if (tileId == null || state.locked[side][slot]) return none(state);
          return {
            state: {
              ...state,
              active: side,
              slots: { ...state.slots, [side]: withSlot(state.slots[side], slot, null) },
            },
            events: [{ type: 'removed', side, slot, tileId }],
          };
        }

        case 'check': {
          const full = SIDES.every((s) => state.slots[s].every((x) => x !== null));
          if (!full) return none(state);
          const checks = state.checks + 1;
          const given = (s: Side) => state.slots[s].map((id) => letterOf(pair, id) ?? '');
          const wrong = SIDES.filter((s) => given(s).join('|') !== pair[s].letters.join('|'));
          if (wrong.length > 0) {
            const events: Ev[] = wrong.map((s) => ({
              type: 'spellWrong' as const,
              itemId: pair.itemId,
              side: s,
              given: given(s).join(''),
              expected: pair[s].letters.join(''),
            }));
            events.push({ type: 'mistake' }, { type: 'lifeLost' });
            return { state: { ...state, checks }, events };
          }
          const next = state.pair + 1;
          const events: Ev[] = [
            { type: 'spellCorrect', itemId: pair.itemId, checks, hints: state.hints },
          ];
          if (checks === 1) events.push({ type: 'combo' });
          const upcoming = pairs[next];
          if (!upcoming) events.push({ type: 'complete' });
          return {
            state: {
              ...state,
              pair: next,
              active: 'source',
              ...(upcoming
                ? emptyFor(upcoming)
                : { slots: { source: [], uz: [] }, locked: { source: [], uz: [] } }),
              checks: 0,
              hints: 0,
            },
            events,
          };
        }

        case 'hint': {
          const { side, slot } = action;
          const expected = pair[side].letters[slot];
          if (expected === undefined || state.locked[side][slot]) return none(state);
          const events: Ev[] = [
            { type: 'hintUsed', itemId: pair.itemId, side, slot },
            { type: 'hint' },
          ];
          const lock = (s: ImloState): ImloState => ({
            ...s,
            hints: s.hints + 1,
            locked: { ...s.locked, [side]: withSlot(s.locked[side], slot, true) },
          });

          const current = state.slots[side][slot] ?? null;
          if (letterOf(pair, current) === expected) {
            return { state: lock(state), events };
          }
          // Prefer a bank tile; otherwise take a matching tile that sits in a slot where it is misplaced.
          const inSlot = new Set([...state.slots.source, ...state.slots.uz]);
          let tile = pair.bank.find((t) => t.letter === expected && !inSlot.has(t.id));
          if (!tile) {
            tile = pair.bank.find((t) => {
              if (t.letter !== expected) return false;
              for (const s of SIDES) {
                const i = state.slots[s].indexOf(t.id);
                if (i >= 0) return !state.locked[s][i] && pair[s].letters[i] !== t.letter;
              }
              return false;
            });
          }
          if (!tile) return none(state);
          const filled = lock(put(state, side, slot, tile.id));
          return { state: { ...filled, active: nextActive(filled, side) }, events };
        }
      }
    },
  };
}

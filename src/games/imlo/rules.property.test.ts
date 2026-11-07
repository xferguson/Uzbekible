import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng } from '@core/random/index.ts';
import { createSession, tallyScoreInput, type SessionEvent } from '@core/session/index.ts';
import type { ImloPair } from './levels.ts';
import { createImloRules, type ImloAction, type ImloEvent } from './rules.ts';

const mk = (id: string, src: string, uz: string, extra = ''): ImloPair => ({
  itemId: id,
  clue: id,
  source: { lang: 'tr', text: src, letters: [...src] },
  uz: { text: uz, letters: [...uz] },
  bank: [
    ...[...src].map((letter, i) => ({ id: `s${i}`, letter, origin: 'source' as const })),
    ...[...uz].map((letter, i) => ({ id: `u${i}`, letter, origin: 'uz' as const })),
    ...[...extra].map((letter, i) => ({ id: `d${i}`, letter, origin: 'distractor' as const })),
  ],
});
const pairs = [mk('a', 'isim', 'ism', 'xq'), mk('b', 'kitap', 'kitob'), mk('c', 'el', 'qoʻl')];
const tileIds = ['s0', 's1', 's2', 's3', 's4', 'u0', 'u1', 'u2', 'u3', 'u4', 'd0', 'd1', 'nope'];
const side = fc.constantFrom('source' as const, 'uz' as const);
const action: fc.Arbitrary<ImloAction> = fc.oneof(
  fc.record({ type: fc.constant('selectSide' as const), side }),
  fc.record({ type: fc.constant('place' as const), tileId: fc.constantFrom(...tileIds) }),
  fc.record({ type: fc.constant('remove' as const), side, slot: fc.integer({ min: 0, max: 5 }) }),
  fc.constant({ type: 'check' as const }),
  fc.record({ type: fc.constant('hint' as const), side, slot: fc.integer({ min: 0, max: 5 }) }),
);

describe('imlo rules invariants', () => {
  it('every tile is in at most one slot; locked slots stay filled; counts stay sane', () => {
    fc.assert(
      fc.property(fc.array(action, { maxLength: 120 }), fc.integer(), (actions, seed) => {
        const rules = createImloRules({ pairs, rng: createRng(seed) });
        let state = rules.init;
        for (const a of actions) {
          const prevPair = state.pair;
          const prevLocked = state.locked;
          state = rules.reduce(state, a).state;
          const cur = pairs[state.pair];
          if (!cur) {
            expect(state.pair).toBe(pairs.length);
            continue;
          }
          const placed = [...state.slots.source, ...state.slots.uz].filter((s) => s !== null);
          expect(new Set(placed).size).toBe(placed.length);
          for (const id of placed) expect(cur.bank.some((t) => t.id === id)).toBe(true);
          expect(state.slots.source).toHaveLength(cur.source.letters.length);
          expect(state.slots.uz).toHaveLength(cur.uz.letters.length);
          if (state.pair === prevPair)
            for (const s of ['source', 'uz'] as const)
              prevLocked[s].forEach((l, i) => {
                if (l) {
                  expect(state.locked[s][i]).toBe(true);
                  expect(state.slots[s][i]).not.toBeNull();
                }
              });
        }
      }),
    );
  });

  it('tallied mistakes equal lives lost; lives never go below 0; complete at most once', () => {
    fc.assert(
      fc.property(fc.array(action, { maxLength: 150 }), fc.integer(), (actions, seed) => {
        const rules = createImloRules({ pairs, rng: createRng(seed) });
        const lives = 3;
        const session = createSession({ rules, lives, countdownMs: 0, clock: { now: () => 0 } });
        const events: SessionEvent<ImloEvent>[] = [];
        session.subscribe((e) => void events.push(e));
        session.start();
        for (const a of actions) session.dispatch(a);
        const left = session.getState().lives;
        expect(left).toBeGreaterThanOrEqual(0);
        expect(tallyScoreInput(events).mistakes).toBe(lives - left);
        expect(events.filter((e) => e.type === 'complete').length).toBeLessThanOrEqual(1);
      }),
    );
  });
});

it('solving by hints alone completes the level without losing a life', () => {
  const rules = createImloRules({ pairs, rng: createRng(7) });
  let state = rules.init;
  let lifeLost = 0;
  let complete = 0;
  const run = (a: ImloAction) => {
    const r = rules.reduce(state, a);
    state = r.state;
    lifeLost += r.events.filter((e) => e.type === 'lifeLost').length;
    complete += r.events.filter((e) => e.type === 'complete').length;
  };
  for (const p of pairs) {
    for (const s of ['source', 'uz'] as const)
      for (let i = 0; i < p[s].letters.length; i++) run({ type: 'hint', side: s, slot: i });
    run({ type: 'check' });
  }
  expect(lifeLost).toBe(0);
  expect(complete).toBe(1);
  expect(state.pair).toBe(pairs.length);
});

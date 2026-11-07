import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random/index.ts';
import { createSession, tallyScoreInput, type SessionEvent } from '../../core/session/index.ts';
import { createJuftRules, type JuftEvent, type JuftAction } from './rules.ts';

const ids = ['a', 'b', 'c', 'd', 'e'];
const sides = fc.constantFrom('left' as const, 'right' as const);
const action: fc.Arbitrary<JuftAction> = fc.oneof(
  fc.record({ type: fc.constant('select' as const), side: sides, tileId: fc.constantFrom(...ids) }),
  fc.record({ type: fc.constant('hint' as const), tileId: fc.constantFrom(...ids) }),
);

describe('juft rules invariants', () => {
  it('matched tiles are never re-selectable; matched ≤ pairs; complete iff all matched', () => {
    fc.assert(
      fc.property(fc.array(action, { maxLength: 80 }), fc.integer(), (actions, seed) => {
        const rules = createJuftRules({ pairIds: ids, rng: createRng(seed) });
        let state = rules.init;
        let completes = 0;
        for (const a of actions) {
          const before = state.matched.length;
          const r = rules.reduce(state, a);
          state = r.state;
          if (a.type === 'select' && state.matched.slice(0, before).includes(a.tileId)) {
            expect(r.events).toEqual([]);
          }
          if (state.selected) expect(state.matched).not.toContain(state.selected.tileId);
          completes += r.events.filter((e) => e.type === 'complete').length;
          expect(state.matched.length).toBeLessThanOrEqual(ids.length);
          expect(new Set(state.matched).size).toBe(state.matched.length);
        }
        expect(completes).toBe(state.matched.length === ids.length ? 1 : 0);
      }),
    );
  });

  it('tallied mistakes equal lives lost', () => {
    fc.assert(
      fc.property(fc.array(action, { maxLength: 80 }), fc.integer(), (actions, seed) => {
        const rules = createJuftRules({ pairIds: ids, rng: createRng(seed) });
        const lives = 4;
        const session = createSession({ rules, lives, countdownMs: 0, clock: { now: () => 0 } });
        const events: SessionEvent<JuftEvent>[] = [];
        session.subscribe((e) => void events.push(e));
        session.start();
        for (const a of actions) session.dispatch(a);
        expect(tallyScoreInput(events).mistakes).toBe(lives - session.getState().lives);
      }),
    );
  });
});

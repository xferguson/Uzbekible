import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../clock';
import { createSession, type Rules } from './index';

type Act = 'add' | 'miss' | 'finish';
const rules: Rules<number, Act> = {
  init: 0,
  reduce: (state, a) =>
    a === 'add'
      ? { state: state + 1, events: [] }
      : { state, events: [{ type: a === 'miss' ? 'lifeLost' : 'complete' }] },
};

const step = fc.oneof(
  fc.constantFrom<Act>('add', 'miss', 'finish').map((a) => ({ k: 'act' as const, a })),
  fc.constantFrom('start', 'pause', 'resume').map((c) => ({ k: 'cmd' as const, c })),
  fc.integer({ min: 0, max: 2000 }).map((ms) => ({ k: 'time' as const, ms })),
);

describe('session invariants', () => {
  it('lives never drop below 0, elapsed never decreases, terminal states absorb', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 2000 }),
        fc.array(step, { maxLength: 60 }),
        (lives, countdownMs, steps) => {
          const clock = createFakeClock();
          const s = createSession({ rules, lives, countdownMs, clock });
          let prevElapsed = 0;
          let terminal: ReturnType<typeof s.getState> | null = null;
          for (const st of steps) {
            if (st.k === 'act') s.dispatch(st.a);
            else if (st.k === 'cmd') s[st.c]();
            else clock.advance(st.ms);
            const state = s.getState();
            expect(state.lives).toBeGreaterThanOrEqual(0);
            expect(state.elapsedMs).toBeGreaterThanOrEqual(prevElapsed);
            prevElapsed = state.elapsedMs;
            if (terminal) expect(state).toEqual(terminal);
            else if (state.phase === 'won' || state.phase === 'lost') terminal = state;
          }
        },
      ),
    );
  });
});

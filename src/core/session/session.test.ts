import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../clock/index.ts';
import { createSession, type Rules, type SessionEvent } from './index.ts';

type Act = { type: 'add'; n: number } | { type: 'miss' } | { type: 'finish' };
const rules: Rules<number, Act> = {
  init: 0,
  reduce: (state, action) => {
    switch (action.type) {
      case 'add':
        return { state: state + action.n, events: [{ type: 'scored', n: action.n }] };
      case 'miss':
        return { state, events: [{ type: 'lifeLost' }] };
      case 'finish':
        return { state, events: [{ type: 'complete' }] };
    }
  },
};

function setup(lives = 3, countdownMs = 3000) {
  const clock = createFakeClock(1000);
  const session = createSession({ rules, lives, countdownMs, clock });
  const events: SessionEvent[] = [];
  session.subscribe((e) => events.push(e));
  return { clock, session, events };
}

describe('lifecycle', () => {
  it('starts ready, then counts down, then plays', () => {
    const { clock, session } = setup();
    expect(session.getState().phase).toBe('ready');
    session.start();
    expect(session.getState().phase).toBe('countdown');
    clock.advance(2999);
    expect(session.getState().phase).toBe('countdown');
    clock.advance(1);
    expect(session.getState().phase).toBe('playing');
  });

  it('skips straight to playing with a zero countdown', () => {
    const { session } = setup(3, 0);
    session.start();
    expect(session.getState().phase).toBe('playing');
  });

  it('start is a no-op unless ready', () => {
    const { clock, session } = setup();
    session.start();
    clock.advance(1000);
    session.start();
    clock.advance(2000);
    expect(session.getState().phase).toBe('playing');
  });

  it('blocks actions until playing', () => {
    const { clock, session } = setup();
    session.dispatch({ type: 'add', n: 1 });
    session.start();
    session.dispatch({ type: 'add', n: 1 });
    expect(session.getState().game).toBe(0);
    clock.advance(3000);
    session.dispatch({ type: 'add', n: 5 });
    expect(session.getState().game).toBe(5);
  });
});

describe('elapsed time', () => {
  it('excludes countdown and paused time', () => {
    const { clock, session } = setup();
    session.start();
    clock.advance(3000);
    clock.advance(400);
    expect(session.getState().elapsedMs).toBe(400);
    session.pause();
    expect(session.getState().phase).toBe('paused');
    clock.advance(10_000);
    expect(session.getState().elapsedMs).toBe(400);
    session.resume();
    clock.advance(100);
    expect(session.getState().elapsedMs).toBe(500);
  });

  it('counts time that passed between the countdown ending and the first read', () => {
    const { clock, session } = setup();
    session.start();
    clock.advance(3500);
    expect(session.getState().elapsedMs).toBe(500);
  });

  it('pause and resume are ignored outside playing/paused; actions blocked while paused', () => {
    const { clock, session } = setup();
    session.pause();
    expect(session.getState().phase).toBe('ready');
    session.start();
    session.pause();
    expect(session.getState().phase).toBe('countdown');
    clock.advance(3000);
    session.resume();
    expect(session.getState().phase).toBe('playing');
    session.pause();
    session.dispatch({ type: 'add', n: 1 });
    expect(session.getState().game).toBe(0);
  });

  it('freezes at the terminal state', () => {
    const { clock, session } = setup();
    session.start();
    clock.advance(3200);
    session.dispatch({ type: 'finish' });
    clock.advance(5000);
    expect(session.getState().elapsedMs).toBe(200);
  });
});

describe('lives and outcomes', () => {
  it('decrements lives on lifeLost and loses at zero', () => {
    const { clock, session } = setup(2, 0);
    session.start();
    session.dispatch({ type: 'miss' });
    expect(session.getState()).toMatchObject({ lives: 1, phase: 'playing' });
    session.dispatch({ type: 'miss' });
    expect(session.getState()).toMatchObject({ lives: 0, phase: 'lost' });
    clock.advance(1);
  });

  it('wins on a complete event', () => {
    const { session } = setup(3, 0);
    session.start();
    session.dispatch({ type: 'finish' });
    expect(session.getState().phase).toBe('won');
  });

  it('loses when the last life and completion coincide', () => {
    const rules2: Rules<null, 'x'> = {
      init: null,
      reduce: (s) => ({ state: s, events: [{ type: 'complete' }, { type: 'lifeLost' }] }),
    };
    const s = createSession({ rules: rules2, lives: 1, countdownMs: 0, clock: createFakeClock() });
    s.start();
    s.dispatch('x');
    expect(s.getState().phase).toBe('lost');
  });

  it('absorbs everything after a terminal state', () => {
    const { session } = setup(1, 0);
    session.start();
    session.dispatch({ type: 'miss' });
    session.dispatch({ type: 'add', n: 9 });
    session.start();
    session.pause();
    session.resume();
    expect(session.getState()).toMatchObject({ phase: 'lost', game: 0, lives: 0 });
  });
});

describe('events', () => {
  it('streams phase changes and rules events in order, with timestamps', () => {
    const { clock, session, events } = setup(3, 1000);
    session.start();
    clock.advance(1000);
    session.dispatch({ type: 'add', n: 2 });
    session.pause();
    session.resume();
    session.dispatch({ type: 'finish' });
    expect(events.map((e) => (e.type === 'phase' ? `phase:${e.phase}` : e.type))).toEqual([
      'phase:countdown',
      'phase:playing',
      'scored',
      'phase:paused',
      'phase:playing',
      'complete',
      'phase:won',
    ]);
    expect(events[0]).toMatchObject({ at: 1000 });
  });

  it('emits the countdown→playing event when the session is first observed late', () => {
    const { clock, session, events } = setup();
    session.start();
    clock.advance(4000);
    session.tick();
    expect(events.some((e) => e.type === 'phase' && e.phase === 'playing')).toBe(true);
  });

  it('stops notifying after unsubscribe', () => {
    const { session, events } = setup();
    const extra: SessionEvent[] = [];
    const off = session.subscribe((e) => extra.push(e));
    off();
    session.start();
    expect(extra).toEqual([]);
    expect(events.length).toBe(1);
  });

  it('rejects invalid options', () => {
    const clock = createFakeClock();
    expect(() => createSession({ rules, lives: 0, countdownMs: 0, clock })).toThrow(RangeError);
    expect(() => createSession({ rules, lives: 1, countdownMs: -1, clock })).toThrow(RangeError);
  });
});

/**
 * Generic game lifecycle: ready → countdown → playing ⇄ paused → won | lost.
 * A game supplies a rules reducer; the session owns phase, lives, elapsed time and the event stream.
 */
import type { Clock } from '../clock/index.ts';

export type Phase = 'ready' | 'countdown' | 'playing' | 'paused' | 'won' | 'lost';

/** Events a rules reducer may emit. `lifeLost` and `complete` drive the session; others pass through. */
export interface RulesEvent {
  type: string;
  [key: string]: unknown;
}

export interface Rules<S, A> {
  init: S;
  reduce(state: S, action: A): { state: S; events: readonly RulesEvent[] };
}

export type SessionEvent =
  | { type: 'phase'; phase: Phase; at: number }
  | (RulesEvent & { at: number });

export interface SessionState<S> {
  phase: Phase;
  lives: number;
  /** Time spent in `playing`; excludes countdown and pauses; frozen once won or lost. */
  elapsedMs: number;
  game: S;
}

export interface SessionOptions<S, A> {
  rules: Rules<S, A>;
  lives: number;
  countdownMs: number;
  clock: Clock;
}

export interface Session<S, A> {
  /** Current state; first advances the countdown if it has run out. */
  getState(): SessionState<S>;
  start(): void;
  pause(): void;
  resume(): void;
  /** Applies a rules action; ignored unless `playing`. */
  dispatch(action: A): void;
  /** Advances time-driven transitions (countdown end). Called by every other method. */
  tick(): void;
  subscribe(listener: (event: SessionEvent) => void): () => void;
}

export function createSession<S, A>(opts: SessionOptions<S, A>): Session<S, A> {
  const { rules, clock, countdownMs } = opts;
  if (!Number.isInteger(opts.lives) || opts.lives < 1) throw new RangeError('lives must be an integer >= 1');
  if (!(countdownMs >= 0)) throw new RangeError('countdownMs must be >= 0');

  let phase: Phase = 'ready';
  let lives = opts.lives;
  let game = rules.init;
  let countdownEnd = 0;
  let accumulated = 0; // playing time banked before the current stretch
  let stretchStart = 0; // when the current playing stretch began
  let frozenElapsed = 0;
  const listeners = new Set<(e: SessionEvent) => void>();

  const emit = (e: SessionEvent): void => {
    for (const l of [...listeners]) l(e);
  };
  const setPhase = (next: Phase, at: number): void => {
    phase = next;
    emit({ type: 'phase', phase, at });
  };
  const elapsed = (): number => {
    if (phase === 'playing') return accumulated + (clock.now() - stretchStart);
    if (phase === 'paused') return accumulated;
    if (phase === 'won' || phase === 'lost') return frozenElapsed;
    return 0;
  };
  const tick = (): void => {
    if (phase === 'countdown' && clock.now() >= countdownEnd) {
      stretchStart = countdownEnd; // time past the end of the countdown counts as played
      setPhase('playing', countdownEnd);
    }
  };
  const finish = (next: 'won' | 'lost', at: number): void => {
    frozenElapsed = elapsed();
    setPhase(next, at);
  };

  return {
    getState: () => {
      tick();
      return { phase, lives, elapsedMs: elapsed(), game };
    },
    tick,
    start() {
      if (phase !== 'ready') return;
      const now = clock.now();
      countdownEnd = now + countdownMs;
      setPhase('countdown', now);
      tick();
    },
    pause() {
      tick();
      if (phase !== 'playing') return;
      const now = clock.now();
      accumulated = elapsed();
      setPhase('paused', now);
    },
    resume() {
      tick();
      if (phase !== 'paused') return;
      const now = clock.now();
      stretchStart = now;
      setPhase('playing', now);
    },
    dispatch(action) {
      tick();
      if (phase !== 'playing') return;
      const at = clock.now();
      const result = rules.reduce(game, action);
      game = result.state;
      let completed = false;
      for (const event of result.events) {
        if (event.type === 'lifeLost') lives = Math.max(0, lives - 1);
        if (event.type === 'complete') completed = true;
        emit({ ...event, at });
      }
      // Losing the last life beats completing on the same step.
      if (lives === 0) finish('lost', at);
      else if (completed) finish('won', at);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

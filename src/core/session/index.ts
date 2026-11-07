/**
 * Generic game lifecycle: ready → countdown → playing ⇄ paused → won | lost.
 * A game supplies a rules reducer; the session owns phase, lives, elapsed time and the event stream.
 */
import type { Clock } from '../clock';

export type Phase = 'ready' | 'countdown' | 'playing' | 'paused' | 'won' | 'lost';

/** Events every game shares. `lifeLost` and `complete` drive the session; all five feed `tallyScoreInput`. */
export type StandardEvent =
  | { type: 'lifeLost' }
  | { type: 'complete' }
  | { type: 'mistake' }
  | { type: 'hint' }
  | { type: 'combo' };

/** A game's own typed events (e.g. tile ids for the UI); they pass through the session untouched. */
export interface GameEvent {
  type: string;
}

/** Events a rules reducer may emit: the standard ones plus the game's own `E`. */
export type RulesEvent<E extends GameEvent = never> = StandardEvent | E;

export interface Rules<S, A, E extends GameEvent = never> {
  init: S;
  reduce(state: S, action: A): { state: S; events: readonly RulesEvent<E>[] };
}

export type SessionEvent<E extends GameEvent = never> =
  { type: 'phase'; phase: Phase; at: number } | (RulesEvent<E> & { at: number });

/** The score-input counts an event stream implies. Time and multipliers come from elsewhere. */
export type ScoreTally = { mistakes: number; hints: number; combos: number };

export function tallyScoreInput(events: readonly GameEvent[]): ScoreTally {
  const tally: ScoreTally = { mistakes: 0, hints: 0, combos: 0 };
  for (const { type } of events) {
    if (type === 'mistake') tally.mistakes++;
    else if (type === 'hint') tally.hints++;
    else if (type === 'combo') tally.combos++;
  }
  return tally;
}

export interface SessionState<S> {
  phase: Phase;
  lives: number;
  /** Time spent in `playing`; excludes countdown and pauses; frozen once won or lost. */
  elapsedMs: number;
  game: S;
}

export interface SessionOptions<S, A, E extends GameEvent = never> {
  rules: Rules<S, A, E>;
  lives: number;
  countdownMs: number;
  clock: Clock;
}

export interface Session<S, A, E extends GameEvent = never> {
  /** Current state; first advances the countdown if it has run out. */
  getState(): SessionState<S>;
  start(): void;
  pause(): void;
  resume(): void;
  /** Applies a rules action; ignored unless `playing`. */
  dispatch(action: A): void;
  /** Advances time-driven transitions (countdown end). Called by every other method. */
  tick(): void;
  subscribe(listener: (event: SessionEvent<E>) => void): () => void;
}

export function createSession<S, A, E extends GameEvent = never>(
  opts: SessionOptions<S, A, E>,
): Session<S, A, E> {
  const { rules, clock, countdownMs } = opts;
  if (!Number.isInteger(opts.lives) || opts.lives < 1)
    throw new RangeError('lives must be an integer >= 1');
  if (!(countdownMs >= 0)) throw new RangeError('countdownMs must be >= 0');

  let phase: Phase = 'ready';
  let lives = opts.lives;
  let game = rules.init;
  let countdownEnd = 0;
  let accumulated = 0; // playing time banked before the current stretch
  let stretchStart = 0; // when the current playing stretch began
  let frozenElapsed = 0;
  const listeners = new Set<(e: SessionEvent<E>) => void>();

  const emit = (e: SessionEvent<E>): void => {
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
        emit({ ...event, at } as SessionEvent<E>);
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

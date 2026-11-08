/**
 * The one game contract. U3's GameShell hosts a `GameDefinition`; E1 implements `levels`; the simulator
 * drives the same definition through `toSimGame` (sim-adapter.ts). Types only: no shell, no logic.
 */
import type { ComponentType } from 'react';
import type { SourceLang } from '../core/text/index.ts';
import type { DifficultyConfig } from '../core/difficulty/index.ts';
import type { Aggregate, LogEventInput } from '../core/learning-log/index.ts';
import type { Rng } from '../core/random/index.ts';
import type { ScoringConfig } from '../core/scoring/index.ts';
import type { GameEvent, Rules, Session, SessionState } from '../core/session/index.ts';

/** The player settings that change what a level contains. */
export interface GameSettings {
  /** Enabled source languages (order is irrelevant; it does not change the level seed). */
  sourceLangs: readonly SourceLang[];
  /** Which Uzbek script the player reads. */
  script: 'latn' | 'cyrl';
}

/** Everything `levels` may depend on. Same context in, same LevelSpec out. */
export interface LevelContext {
  level: number;
  settings: GameSettings;
  /** Per-item learning aggregates, for the scheduler. */
  history: readonly Aggregate[];
  /** The difficulty mode the player picked; only set for a game that declares `modes`. */
  mode?: string;
  /** `<gameId>:<level>:<settingsHash>`, or `<gameId>:<mode>:<level>:<settingsHash>` with a mode: stable, so a level is reproducible. */
  seed: string;
  /** Seeded from `seed`: the only randomness `levels` may use. */
  rng: Rng;
}

/** A concrete level: the game's own `params` (e.g. the pairs on a Juft board) plus what the shell needs. */
export interface LevelSpec<Params> {
  level: number;
  seed: string;
  lives: number;
  params: Params;
}

export interface BoardProps<Params, State, Action, E extends GameEvent = never> {
  spec: LevelSpec<Params>;
  settings: GameSettings;
  state: SessionState<State>;
  dispatch: (action: Action) => void;
  subscribe: Session<State, Action, E>['subscribe'];
}

/** What an endless run reports when it ends. */
export interface RunSummary {
  score: number;
  /** Longest streak of correct answers in the run. */
  streak: number;
  correct: number;
  mistakes: number;
}

export interface GameDefinition<Params, State, Action, E extends GameEvent = never> {
  id: string;
  title: { uzLatn: string; uzCyrl: string };
  /** Difficulty modes the player picks on the map screen. Absent: the game has one mode and no picker. */
  modes?: readonly { id: string; name: { uzLatn: string; uzCyrl: string } }[];
  /** Deterministic for a given context. */
  levels(ctx: LevelContext): LevelSpec<Params>;
  /**
   * Builds the rules for one attempt. `attemptRng` is fresh for every attempt (retry included), so
   * per-attempt layout such as Juft's shuffle changes while the level's content does not.
   */
  createRules(spec: LevelSpec<Params>, attemptRng: Rng): Rules<State, Action, E | GameEvent>;
  scoring: ScoringConfig;
  /** Per-level scoring (par and star thresholds often scale with the board). Falls back to `scoring`. */
  scoringFor?(spec: LevelSpec<Params>, settings: GameSettings): ScoringConfig;
  /** Score multipliers the settings earn (e.g. Cyrillic hard mode). */
  multipliers?(settings: GameSettings, mode?: string): readonly number[];
  /**
   * Learning-log events for one rules event. `rtMs` is the time since the previous rules event (or the start).
   * `level_start`, `level_complete` and `level_failed` are written by the shell.
   */
  logEvents?(spec: LevelSpec<Params>, event: GameEvent, rtMs: number): LogEventInput[];
  difficulty: DifficultyConfig;
  /** The level map's buildings (name in Latin spelling, number of levels each). */
  chapters?: readonly { id: string; name: string; levels: number }[];
  /**
   * Present for a game with no levels and no map (Soxta): the shell opens it as level 1 straight from the home
   * screen, shows run results from `summary` when the lives run out, and keeps the best run.
   */
  endless?: {
    summary(game: State): RunSummary;
    /** How long the final answer stays on the board before the results replace it. */
    holdMs: number;
  };
  Board: ComponentType<BoardProps<Params, State, Action, E>>;
  requires?: { audio?: boolean; microphone?: boolean };
}

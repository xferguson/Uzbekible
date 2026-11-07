/**
 * Screen-state contract for `npm run shots` (V1) and the layout checks built on it (V2). A state names one screen
 * the app can be driven into and says how to get there. Types only: no runtime imports, so unit tests can load the
 * state list without a browser.
 */
import type { Page } from '@playwright/test';

/** Saved progress for one game (`uzbekible:v1:progress:<gameId>`). */
export interface SeedProgress {
  unlocked: number;
  best?: Record<number, { score: number; stars: number; timeMs: number }>;
}

/** Saved settings (`uzbekible:v1:settings`); omitted fields keep the app defaults. */
export interface SeedSettings {
  languages?: string[];
  script?: 'uz-Latn' | 'uz-Cyrl';
  theme?: 'system' | 'light' | 'dark';
}

export interface OpenOptions {
  /** Progress per game id, written before the app starts. */
  progress?: Record<string, SeedProgress>;
  settings?: SeedSettings;
}

/**
 * Game-agnostic moves through the shell (home → map → countdown → board). Time is frozen once the app is open:
 * nothing moves unless a state calls `advance`, so every screenshot is reproducible.
 */
export interface Driver {
  readonly page: Page;
  /** Loads the app with `?seed=&clock=fake`, clean storage plus `opts`, fonts loaded and the clock paused. */
  open(opts?: OpenOptions): Promise<void>;
  /** Moves the frozen clock forward, firing timers and intervals on the way. */
  advance(ms: number): Promise<void>;
  /** Advances in small steps until `done()` holds; throws after `maxMs` of app time. */
  advanceUntil(done: () => Promise<boolean>, opts?: { stepMs?: number; maxMs?: number }): Promise<void>;
  /** Clicks the button with this accessible name (string = exact, RegExp = pattern). */
  tap(name: string | RegExp): Promise<void>;
  /** Home → the game's level map, via its picker button (the game's Uzbek title). */
  openGame(title: string): Promise<void>;
  /** Map → level `n`. `countdownMs` = how much of the 3-2-1 to run (0 = just opened); omitted plays through to the board. */
  startLevel(n: number, opts?: { countdownMs?: number }): Promise<void>;
  /** Fails the run with `message` unless `ok` (a state that missed its target screen is worse than no shot). */
  check(ok: boolean, message: string): void;
}

export interface ScreenState {
  /** Unique kebab-case id: file names (`shots/<id>-<width>-<scheme>.png`) and the key in `docs/design/frames.json`. */
  id: string;
  /** Game id for game screens; `null` for shell screens (home, settings). */
  game: string | null;
  /** One line for the compare page: what the screen should show. */
  title: string;
  /** Drives a freshly opened page into this state. Must leave the clock frozen. */
  reach(d: Driver): Promise<void>;
}

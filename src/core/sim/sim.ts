/**
 * Headless balance simulator. A seeded bot plays a game's rules through a real session on a fake clock,
 * with skill profiles (accuracy by transparency, response-time distribution), and reports per-level stats.
 * Import siblings with explicit `.ts` extensions: scripts/sim.ts runs this under plain Node.
 */
import { createFakeClock } from '../clock/index.ts';
import { createRng, seedFrom, type Rng } from '../random/index.ts';
import { score as scoreOf, starsForScore, type ScoringConfig } from '../scoring/index.ts';
import {
  createSession,
  tallyScoreInput,
  type ScoreTally,
  type GameEvent,
  type Rules,
  type SessionEvent,
} from '../session/index.ts';

/** What the bot faces next: how transparent the item is (0..1) and the two actions it can take. */
export interface SimStep<A> {
  transparency: number;
  correct: A;
  wrong: A;
  /** Tiles on screen. Drives the profile's scan time; absent means no scan time is added. */
  choices?: number;
}

/**
 * The slice of a game the simulator needs. The standard session events (`mistake`, `hint`, `combo`)
 * are tallied into the score input by `tallyScoreInput`; `lifeLost` and `complete` drive the session.
 */
export interface SimGame<S, A> {
  id: string;
  scoring: ScoringConfig;
  lives(level: number): number;
  countdownMs: number;
  createRules(level: number): Rules<S, A, GameEvent>;
  nextStep(state: S, level: number, rng: Rng): SimStep<A>;
}

export interface SimProfile {
  name: string;
  /** Chance of a correct action: `low` at transparency 0, `high` at transparency 1, linear between. */
  accuracy: { low: number; high: number };
  /** Log-normal response time: `median` ms, `spread` = sigma of the log (0 = constant). */
  responseMs: { median: number; spread: number };
  /** Extra ms of visual search per tile on screen, added to the sampled response when `choices` is set. */
  scanMsPerChoice?: number;
}

export const PROFILES: Record<string, SimProfile> = {
  novice: {
    name: 'novice',
    accuracy: { low: 0.35, high: 0.85 },
    responseMs: { median: 3500, spread: 0.4 },
    scanMsPerChoice: 250,
  },
  'b1-turkish': {
    name: 'b1-turkish',
    accuracy: { low: 0.55, high: 0.95 },
    responseMs: { median: 2500, spread: 0.35 },
    scanMsPerChoice: 150,
  },
  expert: {
    name: 'expert',
    accuracy: { low: 0.8, high: 0.99 },
    responseMs: { median: 1200, spread: 0.25 },
    scanMsPerChoice: 60,
  },
};

export interface SimOptions<S, A> {
  game: SimGame<S, A>;
  profiles: readonly (string | SimProfile)[];
  levels: readonly number[];
  runs: number;
  seed: number;
  /** Safety valve: a run that needs more actions than this counts as not completed. */
  maxActions?: number;
}

export interface LevelRow {
  level: number;
  profile: string;
  runs: number;
  completionRate: number;
  /** Median over completed runs; null when none completed. */
  medianTimeMs: number | null;
  /** Median over all runs; runs that were not completed score 0. */
  medianScore: number;
  /** Median mistakes, hints and combos over all runs (events tallied even when a run was lost). */
  medianMistakes: number;
  medianHints: number;
  medianCombos: number;
  /** Run counts for 0, 1, 2 and 3 stars. */
  stars: [number, number, number, number];
}

const DEFAULT_MAX_ACTIONS = 1000;

function resolveProfile(p: string | SimProfile): SimProfile {
  if (typeof p !== 'string') return p;
  const found = PROFILES[p];
  if (!found)
    throw new RangeError(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(', ')}`);
  return found;
}

function gaussian(rng: Rng): number {
  const u = 1 - rng.next(); // (0, 1]
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng.next());
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

interface RunResult {
  won: boolean;
  timeMs: number;
  score: number;
  stars: 0 | 1 | 2 | 3;
  tally: ScoreTally;
}

function playOnce<S, A>(
  game: SimGame<S, A>,
  profile: SimProfile,
  level: number,
  rng: Rng,
  maxActions: number,
): RunResult {
  const clock = createFakeClock();
  const session = createSession({
    rules: game.createRules(level),
    lives: game.lives(level),
    countdownMs: game.countdownMs,
    clock,
  });
  const events: SessionEvent<GameEvent>[] = [];
  session.subscribe((e) => void events.push(e));
  session.start();
  clock.advance(game.countdownMs);

  for (let i = 0; i < maxActions && session.getState().phase === 'playing'; i++) {
    const step = game.nextStep(session.getState().game, level, rng);
    const t = Math.min(1, Math.max(0, step.transparency));
    const accuracy = profile.accuracy.low + (profile.accuracy.high - profile.accuracy.low) * t;
    const { median: med, spread } = profile.responseMs;
    const scanMs = (profile.scanMsPerChoice ?? 0) * (step.choices ?? 0);
    clock.advance(Math.max(1, Math.round(med * Math.exp(spread * gaussian(rng)) + scanMs)));
    session.dispatch(rng.next() < accuracy ? step.correct : step.wrong);
  }

  const state = session.getState();
  const tally = tallyScoreInput(events);
  if (state.phase !== 'won')
    return { won: false, timeMs: state.elapsedMs, score: 0, stars: 0, tally };
  const value = scoreOf({ timeMs: state.elapsedMs, ...tally }, game.scoring);
  return {
    tally,
    won: true,
    timeMs: state.elapsedMs,
    score: value,
    stars: starsForScore(value, game.scoring.starThresholds),
  };
}

export function simulate<S, A>(opts: SimOptions<S, A>): LevelRow[] {
  const { game, levels, runs, seed } = opts;
  if (!Number.isInteger(runs) || runs < 1) throw new RangeError('runs must be an integer >= 1');
  const maxActions = opts.maxActions ?? DEFAULT_MAX_ACTIONS;
  const profiles = opts.profiles.map(resolveProfile);

  const rows: LevelRow[] = [];
  for (const level of levels) {
    for (const profile of profiles) {
      const results: RunResult[] = [];
      for (let run = 0; run < runs; run++) {
        const rng = createRng(seedFrom(`${seed}:${game.id}:${profile.name}:${level}:${run}`));
        results.push(playOnce(game, profile, level, rng, maxActions));
      }
      const won = results.filter((r) => r.won);
      const stars: [number, number, number, number] = [0, 0, 0, 0];
      for (const r of results) stars[r.stars]++;
      rows.push({
        level,
        profile: profile.name,
        runs,
        completionRate: won.length / runs,
        medianTimeMs: won.length ? median(won.map((r) => r.timeMs)) : null,
        medianScore: median(results.map((r) => r.score)),
        medianMistakes: median(results.map((r) => r.tally.mistakes)),
        medianHints: median(results.map((r) => r.tally.hints)),
        medianCombos: median(results.map((r) => r.tally.combos)),
        stars,
      });
    }
  }
  return rows;
}

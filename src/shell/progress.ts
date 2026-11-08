/** Per-game progress in localStorage: highest unlocked level and the best result per level. */
import { createStore, type Store, type StoreOptions } from '@core/storage';
import type { Stars } from '@core/scoring';

export interface LevelBest {
  score: number;
  stars: Stars;
  timeMs: number;
}
export interface Progress {
  /** Highest level the player may start. */
  unlocked: number;
  best: Record<number, LevelBest>;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const schema = {
  version: 1,
  default: { unlocked: 1, best: {} } as Progress,
  validate: (v: unknown): v is Progress =>
    isObject(v) &&
    Number.isInteger(v.unlocked) &&
    (v.unlocked as number) >= 1 &&
    isObject(v.best) &&
    Object.values(v.best).every(
      (b) =>
        isObject(b) &&
        typeof b.score === 'number' &&
        typeof b.timeMs === 'number' &&
        [0, 1, 2, 3].includes(b.stars as number),
    ),
};

/**
 * A game without modes keeps its original key (`progress:<gameId>`), so existing progress is untouched and
 * needs no migration; a game with modes gets one independent store per mode.
 */
export function createProgressStore(
  gameId: string,
  options?: StoreOptions,
  mode?: string,
): Store<Progress> {
  const namespace = mode === undefined ? `progress:${gameId}` : `progress:${gameId}:${mode}`;
  return createStore(namespace, schema, {}, options);
}

/** The mode last chosen for each game, by game id. */
export type ChosenModes = Record<string, string>;

const modesSchema = {
  version: 1,
  default: {} as ChosenModes,
  validate: (v: unknown): v is ChosenModes =>
    isObject(v) && Object.values(v).every((m) => typeof m === 'string'),
};

export function createModeStore(options?: StoreOptions): Store<ChosenModes> {
  return createStore('modes', modesSchema, {}, options);
}

/**
 * Records a cleared level: unlocks the next one and keeps the best score (and its time) and the most
 * stars. Nothing ever decreases. `newBest` is true only when the score strictly beats the old best.
 */
export function recordWin(
  store: Store<Progress>,
  level: number,
  result: LevelBest,
): { newBest: boolean } {
  const prev = store.get().best[level];
  const newBest = prev === undefined || result.score > prev.score;
  store.update((p) => {
    const old = p.best[level];
    const best: LevelBest = !old
      ? result
      : {
          score: Math.max(old.score, result.score),
          stars: Math.max(old.stars, result.stars) as Stars,
          timeMs: result.score > old.score ? result.timeMs : old.timeMs,
        };
    return { unlocked: Math.max(p.unlocked, level + 1), best: { ...p.best, [level]: best } };
  });
  return { newBest };
}

/** The best finished run of an endless game: top score and longest streak, each kept on its own. */
export interface RunBest {
  score: number;
  streak: number;
}

const runBestSchema = {
  version: 1,
  default: { score: 0, streak: 0 } as RunBest,
  validate: (v: unknown): v is RunBest =>
    isObject(v) &&
    typeof v.score === 'number' &&
    v.score >= 0 &&
    typeof v.streak === 'number' &&
    v.streak >= 0,
};

export function createRunBestStore(gameId: string, options?: StoreOptions): Store<RunBest> {
  return createStore(`best:${gameId}`, runBestSchema, {}, options);
}

/** Keeps the best score and streak; `newBest` is true only when the score strictly beats the old best. */
export function recordRun(store: Store<RunBest>, run: RunBest): { newBest: boolean } {
  const prev = store.get();
  store.set({ score: Math.max(prev.score, run.score), streak: Math.max(prev.streak, run.streak) });
  return { newBest: run.score > prev.score };
}

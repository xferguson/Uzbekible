/** Drives the simulator from a `GameDefinition`, so there is no second game contract. */
import { createRng, seedFrom } from '../core/random/index.ts';
import type { Aggregate } from '../core/learning-log/index.ts';
import type { SimGame, SimStep } from '../core/sim/index.ts';
import type { GameDefinition, GameSettings, LevelContext } from './types.ts';
import type { GameEvent } from '../core/session/index.ts';

/** `<gameId>:<level>:<settingsHash>`; the hash ignores source-language order. */
export function levelSeed(gameId: string, level: number, settings: GameSettings): string {
  const canonical = `${[...settings.sourceLangs].sort().join(',')}|${settings.script}`;
  return `${gameId}:${level}:${seedFrom(canonical).toString(16).padStart(8, '0')}`;
}

export function levelContext(
  gameId: string,
  level: number,
  settings: GameSettings,
  history: readonly Aggregate[],
): LevelContext {
  const seed = levelSeed(gameId, level, settings);
  return { level, settings, history, seed, rng: createRng(seedFrom(seed)) };
}

export interface ToSimGameOptions<S, A> {
  settings: GameSettings;
  history: readonly Aggregate[];
  countdownMs: number;
  /** The bot's view of the game: the one thing a definition does not describe. */
  nextStep: (state: S, level: number, rng: ReturnType<typeof createRng>) => SimStep<A>;
}

export function toSimGame<P, S, A, E extends GameEvent>(
  def: GameDefinition<P, S, A, E>,
  opts: ToSimGameOptions<S, A>,
): SimGame<S, A> {
  let attempt = 0;
  const specFor = (level: number) =>
    def.levels(levelContext(def.id, level, opts.settings, opts.history));
  return {
    id: def.id,
    scoring: def.scoring,
    countdownMs: opts.countdownMs,
    lives: (level) => specFor(level).lives,
    createRules(level) {
      const spec = specFor(level);
      const attemptRng = createRng(seedFrom(`${spec.seed}:attempt:${attempt++}`));
      return def.createRules(spec, attemptRng);
    },
    nextStep: opts.nextStep,
  };
}

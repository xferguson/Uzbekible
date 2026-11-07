import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ComponentType } from 'react';
import type { Rng } from '../core/random/index.ts';
import type { Aggregate } from '../core/learning-log/index.ts';
import type { Rules, GameEvent } from '../core/session/index.ts';
import type { ScoringConfig } from '../core/scoring/index.ts';
import type { DifficultyConfig } from '../core/difficulty/index.ts';
import { levelSeed, toSimGame } from './sim-adapter.ts';
import type { BoardProps, GameDefinition, GameSettings, LevelContext, LevelSpec } from './types.ts';
import { simulate } from '../core/sim/index.ts';

interface FakeParams {
  pairs: number;
}
type FakeState = { left: number };
type FakeAction = { type: 'take' } | { type: 'miss' };

const scoring: ScoringConfig = {
  basePoints: 100,
  parMs: 10_000,
  overrunFactor: 2,
  mistakePenalty: 10,
  hintPenalty: 20,
  comboBonus: 5,
  starThresholds: [100, 200, 300],
};
const difficulty: DifficultyConfig<'pairs'> = {
  params: { pairs: { type: 'linear', fromLevel: 1, toLevel: 10, from: 1, to: 4, round: true } },
};

const seenAttemptRngs: Rng[] = [];
const fake: GameDefinition<FakeParams, FakeState, FakeAction> = {
  id: 'fake',
  title: { uzLatn: 'Soxta', uzCyrl: 'Сохта' },
  levels: (ctx) => ({
    level: ctx.level,
    seed: ctx.seed,
    lives: 3,
    params: { pairs: 1 + ctx.history.length },
  }),
  createRules: (spec, attemptRng): Rules<FakeState, FakeAction, GameEvent> => {
    seenAttemptRngs.push(attemptRng);
    return {
      init: { left: spec.params.pairs },
      reduce: (state, action) =>
        action.type === 'take'
          ? {
              state: { left: state.left - 1 },
              events: state.left === 1 ? [{ type: 'complete' }] : [],
            }
          : { state, events: [{ type: 'mistake' }] },
    };
  },
  scoring,
  difficulty,
  Board: (() => null) as ComponentType<BoardProps<FakeParams, FakeState, FakeAction>>,
};

const settings: GameSettings = { sourceLangs: ['tr', 'ru'], script: 'latn' };

describe('GameDefinition contract', () => {
  it('has the documented shape', () => {
    expectTypeOf(fake.levels).parameter(0).toEqualTypeOf<LevelContext>();
    expectTypeOf(fake.levels).returns.toEqualTypeOf<LevelSpec<FakeParams>>();
    expectTypeOf(fake.createRules).parameter(1).toEqualTypeOf<Rng>();
    expectTypeOf<LevelContext['history']>().toEqualTypeOf<readonly Aggregate[]>();
    expectTypeOf<LevelContext['settings']>().toEqualTypeOf<GameSettings>();
    expectTypeOf<BoardProps<FakeParams, FakeState, FakeAction>['dispatch']>().toEqualTypeOf<
      (action: FakeAction) => void
    >();
  });

  it('level seed is <gameId>:<level>:<settingsHash> and ignores source-language order', () => {
    const a = levelSeed('fake', 3, settings);
    expect(a).toMatch(/^fake:3:[0-9a-f]{8}$/);
    expect(levelSeed('fake', 3, { ...settings, sourceLangs: ['ru', 'tr'] })).toBe(a);
    expect(levelSeed('fake', 3, { ...settings, script: 'cyrl' })).not.toBe(a);
  });

  it('drives the sim from a definition, with a fresh attempt rng each createRules call', () => {
    const sim = toSimGame<FakeParams, FakeState, FakeAction, never>(fake, {
      settings,
      history: [],
      countdownMs: 0,
      nextStep: () => ({ transparency: 1, correct: { type: 'take' }, wrong: { type: 'miss' } }),
    });
    expect(sim.id).toBe('fake');
    expect(sim.lives(1)).toBe(3);
    seenAttemptRngs.length = 0;
    const r1 = sim.createRules(2);
    sim.createRules(2);
    expect(r1.init).toEqual({ left: 1 });
    expect(seenAttemptRngs).toHaveLength(2);
    expect(seenAttemptRngs[0]!.next()).not.toBe(seenAttemptRngs[1]!.next());
    const rows = simulate({
      game: sim,
      profiles: ['expert'],
      levels: [1],
      runs: 3,
      seed: 1,
    });
    expect(rows[0]!.completionRate).toBeGreaterThan(0);
  });
});

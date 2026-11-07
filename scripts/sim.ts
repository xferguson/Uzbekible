// npm run sim -- --game <id> --levels a-b --profiles novice,b1-turkish,expert --runs n --seed s
// Prints a markdown balance table. Games register their SimGame in GAMES below as they land.
import { runCli, type SimGame } from '../src/core/sim/index.ts';

type DemoState = { done: number };
type DemoAction = { correct: boolean };

/** Smoke-test game: `level + 2` items, three lives; transparency falls as levels rise. */
const demo: SimGame<DemoState, DemoAction> = {
  id: 'demo',
  scoring: {
    basePoints: 1000,
    parMs: 20_000,
    overrunFactor: 3,
    mistakePenalty: 100,
    hintPenalty: 50,
    comboBonus: 10,
    starThresholds: [300, 600, 900],
  },
  lives: () => 3,
  countdownMs: 0,
  createRules: (level) => ({
    init: { done: 0 },
    reduce: (s, a) => {
      if (!a.correct) return { state: s, events: [{ type: 'mistake' }, { type: 'lifeLost' }] };
      const done = s.done + 1;
      return {
        state: { done },
        events: [{ type: 'combo' }, ...(done >= level + 2 ? [{ type: 'complete' }] : [])],
      };
    },
  }),
  nextStep: (_s, level) => ({
    transparency: Math.max(0, 1 - level / 10),
    correct: { correct: true },
    wrong: { correct: false },
  }),
};

const GAMES: Record<string, SimGame<unknown, unknown>> = {
  demo: demo as SimGame<unknown, unknown>,
};

try {
  process.stdout.write(runCli(process.argv.slice(2), GAMES));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

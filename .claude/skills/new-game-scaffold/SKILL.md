---
name: new-game-scaffold
description: Use when adding or restructuring a game: GameDefinition contract, folder layout, shared modules to reuse.
---

# Adding a game

A game is a thin layer of **rules + layout** on top of shared modules. If you find yourself writing a timer,
shuffle, score formula, storage code, or text normalization inside `src/games/<id>/`, stop — use or extend
the shared module.

## Folder layout
```
src/games/<id>/
  definition.ts          # GameDefinition export (registered in src/games/registry.ts)
  rules.ts               # pure game rules on top of core/session (reducer/events) + rules.test.ts
  levels.ts              # level generator: content + core/difficulty + core/scheduler + core/random
  scoring.config.ts      # parameters for core/scoring (no formulas here)
  difficulty.config.ts   # parameters for core/difficulty
  Board.tsx              # layout composed from src/ui components
  <id>.e2e.ts            # Playwright happy path (see e2e-visual-check)
e2e/states/<id>.ts       # screen states for npm run shots / layout checks, spread into e2e/states.ts
docs/design/frames.json  # one entry per state -> the game's approved mockup frames
docs/games/<NN>-<id>.md  # product spec (must exist first)
```

## GameDefinition contract (see `src/games/types.ts`)
```ts
interface GameDefinition<Params, State, Action, E extends GameEvent = never> {
  id: string;                                   // 'juft'
  title: { uzLatn: string; uzCyrl: string };
  levels(ctx: LevelContext): LevelSpec<Params>; // deterministic: ctx = { level, settings, history, seed, rng }
  createRules(spec: LevelSpec<Params>, attemptRng: Rng): Rules<State, Action, E | GameEvent>; // core/session
  scoring: ScoringConfig;
  difficulty: DifficultyConfig;
  Board: React.ComponentType<BoardProps<Params, State, Action, E>>;
  requires?: { audio?: boolean; microphone?: boolean };
}
```
- `LevelContext.seed` is `<gameId>:<level>:<settingsHash>` (`levelSeed` in `src/games/sim-adapter.ts`); `rng` is seeded
  from it, so a level's content is reproducible. `history` is the learning-log aggregates, for the scheduler.
- `attemptRng` is fresh for every attempt (retry included): per-attempt layout (Juft's shuffle) uses it, level content never does.
- The simulator runs a definition through `toSimGame(def, { settings, history, countdownMs, nextStep })`; only the bot's `nextStep` is extra. No second contract.
The `GameShell` provides: countdown, HUD (timer/lives/score), pause, results, level map, persistence of
progress/best scores, learning-log writes, and settings. A game never imports another game.

## Shared modules to reuse
| Need | Module |
|---|---|
| lifecycle, lives, timer | `core/session` + `core/clock` |
| shuffle, sampling, seeds | `core/random` (level seed = `<gameId>:<level>:<settingsHash>`) |
| points, stars | `core/scoring` |
| level → params | `core/difficulty` |
| which items next | `core/scheduler` |
| text compare/letters/scripts | `core/text` |
| fuzzy match, cognate transparency | `core/similarity` |
| suffixes | `core/morphology` |
| saving | `core/storage` (namespace = game id) |
| attempts for research | `core/learning-log` |
| audio / mic | `core/audio`, `core/speech` interfaces (inject fakes in tests) |
| tiles, HUD, map, results | `src/ui/*` |

## Steps
1. Spec exists in `docs/games/` and design mockups for the game are approved (D-task merged).
2. Break the game into task files (`docs/tasks/_TEMPLATE.md`): rules, levels, scoring config, board, wiring, e2e.
3. Implement each with the `tdd-task` skill. Tune numbers with `game-balance-tuning`.
4. Register in `src/games/registry.ts`; add to the home screen via the registry (no hardcoded lists).
5. Add the game's screen states (`e2e/states/<id>.ts`: map, ready, countdown, each board size, wrong, hint, pause,
   results 1/2/3 stars, fail, plus any game-specific screen) and map them in `docs/design/frames.json`; a
   `scripts/shots.test.ts` check fails until you do. Then `npm run shots -- --games <id>` and compare against the
   mockups before the board/wiring PRs merge.

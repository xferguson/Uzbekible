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
docs/games/<NN>-<id>.md  # product spec (must exist first)
```

## GameDefinition contract (see `src/games/types.ts`)
```ts
interface GameDefinition<Rules, Params> {
  id: string;                    // 'juft'
  title: { uzLatn: string; uzCyrl: string };
  levels: LevelSource<Params>;   // (levelNumber, settings, rng) => LevelSpec
  createRules: (spec: LevelSpec<Params>) => Rules;   // built on core/session
  scoring: ScoringConfig;
  difficulty: DifficultyConfig<Params>;
  Board: React.ComponentType<BoardProps<Rules>>;
  requires?: { audio?: boolean; microphone?: boolean };
}
```
The `GameShell` provides: countdown, HUD (timer/lives/score), pause, results, level map, persistence of
progress/best scores, learning-log writes, and settings. A game never imports another game.

## Shared modules to reuse
| Need | Module |
|---|---|
| lifecycle, lives, timer | `core/session` + `core/clock` |
| shuffle, sampling, seeds | `core/random` (seed = `${gameId}:${level}`) |
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

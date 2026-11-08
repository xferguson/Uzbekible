# I7: Imlo wiring, registry entry and e2e

| | |
|---|---|
| Status | done |
| Lane | I Imlo |
| Depends on | [I6](I6-imlo-board.md), [I5](I5-game-modes.md), [I8](I8-imlo-scoring-balance.md) |
| Read first | `src/games/juft/definition.ts`, `src/games/juft/juft.e2e.ts`, `docs/games/06-imlo.md` ("Learning-log events") |
| API used | `docs/api.md` § `core/learning-log`, `ui` (`LevelMap`, Results) |
| Skills | `tdd-task`, `new-game-scaffold`, `e2e-visual-check`, `pr-flow` |
| Branch | `task/I7-imlo-wiring-e2e` |

## Goal
Register Imlo as a playable game: definition, home entry, level map, results, learning log, and an e2e suite.

## Acceptance criteria
- [x] `imloDefinition` registered; home lists Imlo next to Juft; modes Oson / Oʻrta / Qiyin
- [x] Learning-log events as in the spec, including `spell_wrong {given, expected}`
- [x] e2e: complete a level, fail a level, switch mode, Cyrillic setting, offline replay; screenshots for the PR
- [x] PRD game table and status updated

## Test-first plan
- Red: `src/games/imlo/imlo.e2e.ts`: from home, start Imlo level 1 in Oson, spell every pair, reach results with stars

## Files likely touched
- `src/games/imlo/definition.ts`, `src/games/imlo/index.ts`, `src/games/registry.ts`, `src/games/imlo/imlo.e2e.ts`, `docs/PRD.md`

# E1: Juft level generator

| | |
|---|---|
| Status | todo |
| Lane | E Juft engine |
| Depends on | [C5](C5-content-schema-pipeline.md), [K7](K7-core-scheduler.md), [K8](K8-core-similarity.md), [K4](K4-core-scoring-difficulty.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/E1-juft-levels` |

## Goal
Turn content + settings + level number into a deterministic LevelSpec.

## Acceptance criteria
- [ ] `src/games/juft/levels.ts`: `levelSpec(level, settings, history)` using `core/difficulty` params, `core/scheduler`, `core/random` seed `juft:<level>:<settingsHash>`
- [ ] Per pair, chooses one source form among enabled languages (prefer `tr`)
- [ ] Excludes false friends; respects suffixed-form share param; inserts declared hard-pair levels
- [ ] `difficulty.config.ts` initial curve per `docs/games/01-juft.md`

## Test-first plan
- Property: every left tile has exactly one right match; no duplicate items; deterministic for seed; only enabled languages appear
- Unit: level 1 is 1 pair; hard-pair levels have 1 pair

## Files likely touched
- `src/games/juft/levels.ts`
- `src/games/juft/difficulty.config.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task E1 (Juft level generator). Read CLAUDE.md and docs/tasks/E1-juft-levels.md first, and follow the skills it lists (tdd-task, new-game-scaffold, pr-flow). Confirm that its dependencies (C5 and K7 and K8 and K4) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

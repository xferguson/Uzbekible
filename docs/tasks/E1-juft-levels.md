# E1: Juft level generator

| | |
|---|---|
| Status | todo |
| Lane | E Juft engine |
| Read first | `docs/games/01-juft.md`, `docs/architecture.md` (rows you use) (other docs only if needed) |
| Depends on | [C5](C5-content-schema-pipeline.md), [K7](K7-core-scheduler.md), [K8](K8-core-similarity.md), [K4](K4-core-scoring-difficulty.md), [Q2](Q2-content-transparency.md), [Q7](Q7-game-contract.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/E1-juft-levels` |

## Goal
Turn content + settings + level number into a deterministic LevelSpec.

## Acceptance criteria
- [ ] `src/games/juft/levels.ts`: `levelSpec(level, settings, history)` using `core/difficulty` params, `core/scheduler`, `core/random` seed `juft:<level>:<settingsHash>`
- [ ] Per pair, chooses one source form among enabled languages (prefer `tr`)
- [ ] Excludes false friends; respects suffixed-form share param; inserts declared hard-pair levels
- [ ] `difficulty.config.ts` initial curve per `docs/games/01-juft.md`: 120 levels in 8 chapters of 15, pair count ramping from 1 to a maximum of **12 pairs** (levels 106–120), hard-pair breathers every ~5th level
- [ ] Pair count is capped at 12 for any level (including levels past 120, if added later); beyond the cap, difficulty rises via transparency mix, suffixed-form share and par time
- [ ] Enough distinct items for a 12-pair board in every enabled-language combination; if a combination runs short, fill from scheduler reviews rather than shrink the board

## Test-first plan
- Property: every left tile has exactly one right match; no duplicate items; deterministic for seed; only enabled languages appear
- Unit: level 1 is 1 pair; hard-pair levels have 1 pair; levels 106–120 have 12 pairs
- Property: pairs per level ≤ 12 for every level

## Files likely touched
- `src/games/juft/levels.ts`
- `src/games/juft/difficulty.config.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task E1 (Juft level generator). Read CLAUDE.md and docs/tasks/E1-juft-levels.md first, and follow the skills it lists (tdd-task, new-game-scaffold, pr-flow). Confirm that its dependencies (C5 and K7 and K8 and K4 and Q2 and Q7) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

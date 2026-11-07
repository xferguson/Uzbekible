# K4: core/scoring + core/difficulty

| | |
|---|---|
| Status | todo |
| Lane | D Core |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `game-balance-tuning`, `pr-flow` |
| Branch | `task/K4-core-scoring-difficulty` |

## Goal
All game maths as pure, config-driven functions.

## Acceptance criteria
- [ ] `score({timeMs, mistakes, hints, combos, multipliers}, config)` with time decay vs par, penalties, combo bonus, floor at 0
- [ ] `stars(result, config)` → 0–3
- [ ] `paramsFor(level, difficultyConfig)` supporting linear/step/logistic curves per param + explicit special levels (e.g. hard-pair breathers)

## Test-first plan
- Property: score ≥ 0; faster never lower; more mistakes/hints never higher; stars monotonic in score
- Property: params non-decreasing in level except declared special levels

## Files likely touched
- `src/core/scoring/**`
- `src/core/difficulty/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task K4 (core/scoring + core/difficulty). Read CLAUDE.md and docs/tasks/K4-core-scoring-difficulty.md first, and follow the skills it lists (tdd-task, game-balance-tuning, pr-flow). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

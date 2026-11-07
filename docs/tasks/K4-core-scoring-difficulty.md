# K4: core/scoring + core/difficulty

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
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

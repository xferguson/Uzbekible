# K10: core/sim: balance simulator

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K3](K3-core-session.md), [K4](K4-core-scoring-difficulty.md), [K2](K2-core-random-clock.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `game-balance-tuning`, `pr-flow` |
| Branch | `task/K10-core-sim` |

## Goal
Headless bot runner so difficulty/scoring are tuned with data.

## Acceptance criteria
- [ ] `simulate({definition, profiles, levels, runs, seed})` → per-level table (completion rate, median time/score, star distribution)
- [ ] Profiles `novice`, `b1-turkish`, `expert` defined as data (accuracy by transparency, response-time distribution)
- [ ] `npm run sim -- --game <id> --levels a-b --profiles ... --runs n --seed s` prints a markdown table

## Test-first plan
- Unit: deterministic output for a seed; a trivial fake game definition yields expected rates

## Files likely touched
- `src/core/sim/**`
- `scripts/sim.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task K10 (core/sim: balance simulator). Read CLAUDE.md and docs/tasks/K10-core-sim.md first, and follow the skills it lists (tdd-task, game-balance-tuning, pr-flow). Confirm that its dependencies (K3 and K4 and K2) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

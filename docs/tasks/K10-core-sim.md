# K10: core/sim: balance simulator

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K3](K3-core-session.md), [K4](K4-core-scoring-difficulty.md), [K2](K2-core-random-clock.md) |
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

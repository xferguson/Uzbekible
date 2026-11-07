# Q6: Sim ready for E3: scan-time model, CLI out of core

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/tasks/E3-juft-scoring-balance.md`, `.claude/skills/game-balance-tuning/SKILL.md` (other docs only if needed) |
| Depends on | [Q5](Q5-game-event-vocabulary.md) |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q6-sim-scan-time` |

## Goal
Let the simulator model what E3 must validate (bot response time grows with the number of tiles on screen) and keep `core/sim` free of CLI concerns.

## Acceptance criteria
- [ ] `SimStep` gains `choices` (tiles on screen); `SimProfile` gains a scan-time term (e.g. `scanMsPerChoice`) added to the sampled response time; defaults keep existing tables unchanged when `choices` is absent
- [ ] `parseArgs`, `runCli`, `formatTable` move from `src/core/sim` to `scripts/sim.ts` (or `scripts/sim-cli.ts`) with their tests
- [ ] A test with a Juft-shaped SimGame (via Q5 events) reports non-zero mistakes/hints/combos in its scores

## Test-first plan
- Red: Unit: same seed, `choices` 2 vs 24 → median time strictly larger for 24
- Property: median time is non-decreasing in `choices` for a fixed seed and profile

## Files likely touched
- `src/core/sim/sim.ts` (+ tests)
- `scripts/sim.ts`

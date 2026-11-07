# E3: Juft scoring config + balance pass

| | |
|---|---|
| Status | todo |
| Lane | E Juft engine |
| Read first | `docs/games/01-juft.md`, `docs/architecture.md` (rows you use) (other docs only if needed) |
| Depends on | [K4](K4-core-scoring-difficulty.md), [E2](E2-juft-rules.md), [K10](K10-core-sim.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `game-balance-tuning`, `tdd-task`, `pr-flow` |
| Branch | `task/E3-juft-scoring-balance` |

## Goal
Set Juft scoring/stars parameters and validate the curve with the simulator.

## Acceptance criteria
- [ ] `scoring.config.ts` (par time per pair, penalties, hint cost, combo, Cyrillic multiplier)
- [ ] `docs/games/01-juft-balance.md` with sim tables for levels 1–40 × 3 profiles
- [ ] Targets: novice clears levels 1–5 with ≥1 star; b1-turkish failure rate 10–25% on levels 10–30

## Test-first plan
- Unit: config passes core/scoring property suite with Juft parameters

## Files likely touched
- `src/games/juft/scoring.config.ts`
- `docs/games/01-juft-balance.md`

## Session prompt (copy-paste)
```
Work on Uzbekible task E3 (Juft scoring config + balance pass). Read CLAUDE.md and docs/tasks/E3-juft-scoring-balance.md first, and follow the skills it lists (game-balance-tuning, tdd-task, pr-flow). Confirm that its dependencies (K4 and E2 and K10) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

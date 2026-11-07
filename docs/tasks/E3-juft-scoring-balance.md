# E3: Juft scoring config + balance pass

| | |
|---|---|
| Status | done |
| Lane | E Juft engine |
| Read first | `docs/games/01-juft.md`, `docs/architecture.md` (rows you use) (other docs only if needed) |
| Depends on | [K4](K4-core-scoring-difficulty.md), [E2](E2-juft-rules.md), [K10](K10-core-sim.md), [Q5](Q5-game-event-vocabulary.md), [Q6](Q6-sim-scan-time.md) |
| Skills | `game-balance-tuning`, `tdd-task`, `pr-flow` |
| Branch | `task/E3-juft-scoring-balance` |

## Goal
Set Juft scoring/stars parameters and validate the curve with the simulator.

## Acceptance criteria
- [ ] Drive the sim via `toSimGame(juftDefinition, …)` (`src/games/sim-adapter.ts`), not a separate game type
- [ ] `scoring.config.ts` (par time per pair, penalties, hint cost, combo, Cyrillic multiplier)
- [ ] `docs/games/01-juft-balance.md` with sim tables for levels 1–120 × 3 profiles (the curve goes up to 12-pair boards)
- [ ] Par time and star thresholds scale with pair count up to 12 pairs; check that scan time on 10–12-pair boards is modelled (the bot's response time grows with tiles on screen)
- [ ] Targets: novice clears levels 1–5 with ≥1 star; b1-turkish failure rate 10–25% on levels 10–30

## Test-first plan
- Unit: config passes core/scoring property suite with Juft parameters

## Files likely touched
- `src/games/juft/scoring.config.ts`
- `docs/games/01-juft-balance.md`

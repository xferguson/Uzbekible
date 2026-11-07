# I8: Imlo scoring config and balance pass

| | |
|---|---|
| Status | todo |
| Lane | I Imlo |
| Depends on | [I3](I3-imlo-rules.md), [K10](K10-core-sim.md) |
| Read first | `docs/games/06-imlo.md` ("Rules", "Level progression"), `src/games/juft/scoring.config.ts`, `src/games/juft/balance.ts` |
| API used | `docs/api.md` § `core/scoring`, `core/sim` |
| Skills | `tdd-task`, `game-balance-tuning`, `pr-flow` |
| Branch | `task/I8-imlo-scoring-balance` |

## Goal
Scoring and star thresholds per level and mode, tuned by simulation so stars are earnable and Qiyin is clearly harder.

## Acceptance criteria
- [ ] `scoringFor(spec)`: par time per pair scales with letter count and bank size; wrong-check and hint costs from config
- [ ] Mode multipliers (Oʻrta ×1.25, Qiyin ×1.5 to start) and the Cyrillic multiplier via `multipliers`
- [ ] A sim player model for spelling (time per tile tap, error rate rising with distractors); simulation table in the PR
- [ ] Config only after the model lands; no rules changes

## Test-first plan
- Red: `src/games/imlo/scoring.config.test.ts`: a flawless level at par earns 3 stars in every mode
- Property: score never below 0; more wrong checks never score higher

## Files likely touched
- `src/games/imlo/scoring.config.ts`, `src/games/imlo/balance.ts`, tests

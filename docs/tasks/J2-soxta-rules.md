# J2: Soxta rules on core/session

| | |
|---|---|
| Status | on hold: Game 5 is backlog like Games 2–4; resume after Juft v1 (R1) |
| Lane | J Soxta |
| Depends on | [K3](K3-core-session.md), [K4](K4-core-scoring-difficulty.md), [J1](J1-soxta-card-pool.md) |
| Read first | `docs/games/05-soxta.md` ("Core loop", "Decisions"), `docs/architecture.md` (rows you use) |
| API used | `docs/api.md` § `core/session`, `core/scoring`, `core/difficulty`, `core/random` |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/J2-soxta-rules` |

## Goal
Pure reducer for the swipe loop: card order, side assignment, answer, per-card timer, lives, streak multiplier.

## Acceptance criteria
- [ ] Actions: `swipe(side)`, `tick(ms)`; events from the shared vocabulary (Q5): correct, wrong, timeout, `lifeLost`, run end
- [ ] Side of the Uzbek word and card order come from the injected `Rng`; same seed, same run
- [ ] Per-card time limit tightens with streak via `core/difficulty` (config only); timeout = wrong
- [ ] Run ends at 3 lives lost (config); streak multiplier via `core/scoring`
- [ ] Missed cards resurface later (`core/scheduler`)
- [ ] Exposes a clue-kind hook so a later "both fit" control card can be added without changing the reducer shape

## Test-first plan
- Red: a swipe toward the clued word scores and advances; the other side loses a life
- Property: lives never go below 0; run is over iff lives = 0; clue side is always the one that owns the clue

## Files likely touched
- `src/games/soxta/rules.ts`, `src/games/soxta/config.ts`

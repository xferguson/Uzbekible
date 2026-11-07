# K6: core/learning-log + export

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K5](K5-core-storage.md) |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K6-core-learning-log` |

## Goal
The research instrument: every attempt logged locally and exportable.

## Acceptance criteria
- [ ] Typed event union (see `docs/games/01-juft.md` › Learning-log events) with `gameId`, `ts`, `sessionId`
- [ ] Append-only with cap; overflow rolls oldest events into per-item aggregates (attempts, correct, mean rt)
- [ ] `exportJson()`, `exportCsv()` (one row per event, stable columns)
- [ ] `aggregates()` per item × source language × relation

## Test-first plan
- Unit: cap/rollover correctness; CSV escaping (commas, quotes, RTL text)
- Property: aggregates after rollover equal aggregates computed from full history

## Files likely touched
- `src/core/learning-log/**`

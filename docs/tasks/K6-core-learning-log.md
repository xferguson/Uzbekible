# K6: core/learning-log + export

| | |
|---|---|
| Status | todo |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K5](K5-core-storage.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task K6 (core/learning-log + export). Read CLAUDE.md and docs/tasks/K6-core-learning-log.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (K5) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

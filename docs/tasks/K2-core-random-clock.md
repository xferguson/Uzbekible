# K2: core/random + core/clock

| | |
|---|---|
| Status | todo |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K2-core-random-clock` |

## Goal
Deterministic randomness and time for every game, test, and simulation.

## Acceptance criteria
- [ ] `createRng(seed)` (sfc32 or mulberry32), `seedFrom(string)`, `shuffle`, `sample`, `weightedPick`, `int(min,max)`
- [ ] `Clock` interface (`now()`), `systemClock`, `createFakeClock()` with `advance(ms)`
- [ ] `frameLoop(clock, cb)` abstraction usable with fake clock

## Test-first plan
- Property: shuffle is a permutation; same seed → same sequence; `int` within bounds; weightedPick never returns zero-weight items
- Unit: fake clock advance drives frameLoop deterministically

## Files likely touched
- `src/core/random/**`
- `src/core/clock/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task K2 (core/random + core/clock). Read CLAUDE.md and docs/tasks/K2-core-random-clock.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

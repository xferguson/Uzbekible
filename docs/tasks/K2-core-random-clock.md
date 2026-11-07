# K2: core/random + core/clock

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K2-core-random-clock` |

## Goal
Deterministic randomness and time for every game, test, and simulation.

## Acceptance criteria
- [x] `createRng(seed)` (sfc32 or mulberry32), `seedFrom(string)`, `shuffle`, `sample`, `weightedPick`, `int(min,max)`
- [x] `Clock` interface (`now()`), `systemClock`, `createFakeClock()` with `advance(ms)`
- [x] `frameLoop(clock, cb)` abstraction usable with fake clock

## Test-first plan
- Property: shuffle is a permutation; same seed → same sequence; `int` within bounds; weightedPick never returns zero-weight items
- Unit: fake clock advance drives frameLoop deterministically

## Files likely touched
- `src/core/random/**`
- `src/core/clock/**`

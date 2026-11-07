# K7: core/scheduler: which items next

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K6](K6-core-learning-log.md), [K2](K2-core-random-clock.md) |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K7-core-scheduler` |

## Goal
Pick items for a level: new items in frequency order + re-show recently missed items.

## Acceptance criteria
- [ ] `nextItems(pool, history, n, rng, opts)`; `opts.reviewRatio` configurable
- [ ] Simple per-item mastery estimate from learning-log aggregates (documented formula)
- [ ] Respects enabled source languages filter passed in

## Test-first plan
- Property: returns exactly min(n, pool) distinct items; deterministic for a seed; never returns filtered-out items
- Unit: missed items reappear within k levels

## Files likely touched
- `src/core/scheduler/**`

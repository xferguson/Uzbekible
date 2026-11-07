# K7: core/scheduler: which items next

| | |
|---|---|
| Status | in review |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K6](K6-core-learning-log.md), [K2](K2-core-random-clock.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task K7 (core/scheduler: which items next). Read CLAUDE.md and docs/tasks/K7-core-scheduler.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (K6 and K2) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

# K3: core/session: shared game lifecycle

| | |
|---|---|
| Status | todo |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K2](K2-core-random-clock.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K3-core-session` |

## Goal
Generic state machine every game runs inside: ready → countdown → playing ⇄ paused → won | lost.

## Acceptance criteria
- [ ] `createSession({rules, lives, countdownMs, clock})` hosting a game rules reducer `(state, action) => {state, events}`
- [ ] Elapsed time excludes paused time; countdown blocks actions
- [ ] Lives decrement via rules events; 0 lives → `lost`; rules `complete` event → `won`
- [ ] Event stream subscription (for HUD, logging, announcer)

## Test-first plan
- Property: lives never < 0; terminal states absorb all actions; elapsed is monotonic non-decreasing
- Unit: pause/resume timing with fake clock

## Files likely touched
- `src/core/session/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task K3 (core/session: shared game lifecycle). Read CLAUDE.md and docs/tasks/K3-core-session.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (K2) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

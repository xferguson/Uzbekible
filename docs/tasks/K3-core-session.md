# K3: core/session: shared game lifecycle

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K2](K2-core-random-clock.md) |
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

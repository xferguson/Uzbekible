# <ID>: <Title>

| | |
|---|---|
| Status | todo |
| Lane | <lane> |
| Depends on | <task links or none> |
| Read first | <only the docs/sections this task needs; UI tasks also list the owned frame PNGs> |
| Screens owned | <state ids from `docs/design/frames.json`, e.g. `home`, `settings`, or `none`> |
| API used | <`docs/api.md` sections this task calls, e.g. `core/scoring`, or none> |
| Skills | `tdd-task`, `pr-flow`, ... |
| Branch | `task/<ID>-<slug>` |

## Goal
<one or two sentences>

## Acceptance criteria
- [ ] ...
- [ ] (UI tasks) matches the owned frames at 360/390/1280, light and dark, comparison in the PR

## Test-first plan
- Red: <the first failing test>
- Property: <invariants, if pure logic>

## Files likely touched
- `...`

## Notes for next tasks
<optional: gotchas found while doing the task, e.g. Node import quirks>

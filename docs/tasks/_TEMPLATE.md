# <ID>: <Title>

| | |
|---|---|
| Status | todo |
| Lane | <lane> |
| Depends on | <task links or none> |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow`, ... |
| Branch | `task/<ID>-<slug>` |

## Goal
<one or two sentences>

## Acceptance criteria
- [ ] ...

## Test-first plan
- Red: <the first failing test>
- Property: <invariants, if pure logic>

## Files likely touched
- `...`

## Session prompt (copy-paste)
```
Work on Uzbekible task <ID> (<Title>). Read CLAUDE.md and docs/tasks/<file> first, and follow the skills it lists. Confirm that its dependencies are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

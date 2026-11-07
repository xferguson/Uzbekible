# K5: core/storage: versioned localStorage

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K5-core-storage` |

## Goal
Safe persistence with namespaces, schemas, and migrations.

## Acceptance criteria
- [ ] `createStore(namespace, schema, migrations, {backend})` with get/set/update/subscribe
- [ ] Keys `uzbekible:v<n>:<namespace>`; try/catch around every access; in-memory fallback when localStorage throws
- [ ] Migration chain runs on read; invalid data → reset to default + warning event (never crash)

## Test-first plan
- Property: any value valid under vN migrates to a valid vN+1
- Unit: throwing backend falls back to memory; corrupt JSON resets

## Files likely touched
- `src/core/storage/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task K5 (core/storage: versioned localStorage). Read CLAUDE.md and docs/tasks/K5-core-storage.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

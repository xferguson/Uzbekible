# K5: core/storage: versioned localStorage

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
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

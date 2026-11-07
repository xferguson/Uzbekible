# Q3: Honest coverage: measure index.ts files, per-file core thresholds

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/architecture.md` (Quality gates) (other docs only if needed) |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q3-honest-coverage` |

## Goal
Make the coverage gate measure the code it claims to. `vite.config.ts` excludes `src/**/index.ts`, yet most core modules (session, clock, random, scoring, difficulty, storage, learning-log, text, motif) live in `index.ts`, so 440 of 737 core lines are unmeasured.

## Acceptance criteria
- [ ] Coverage `exclude` keeps only tests, `src/test-setup.ts` and `src/main.tsx` (pure re-export barrels may stay excluded only if listed by path)
- [ ] `src/core/**` thresholds are per-file (`perFile` or per-module globs) at ≥ 95% lines and branches; `src/ui/**` stays ≥ 80%
- [ ] Backfill tests until green: clock (`systemClock` rAF and setTimeout paths), storage (throwing backend, corrupt/migration branches), text, motif and learning-log uncovered branches
- [ ] Thresholds are not lowered anywhere

## Test-first plan
- Red: Remove the exclusion first: `npm test -- --coverage` fails (clock 82%, storage 84%, motif 90%, text 91%, learning-log 92% branches); paste it

## Files likely touched
- `vite.config.ts`
- `src/core/{clock,storage,text,motif,learning-log}/*.test.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task Q3 (Honest coverage: measure index.ts files, per-file core thresholds). Read CLAUDE.md and docs/tasks/Q3-honest-coverage.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

# Q8: Consolidate duplicated types and helpers

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/architecture.md` (`text`, `content`, `scheduler` rows) (other docs only if needed) |
| Depends on | [Q1](Q1-node-runnable-core.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q8-type-helper-consolidation` |

## Goal
Remove small duplications before more games copy them: two different `Lang` types, a duplicated frequency sort, a scheduler that can return false friends, and an unused alias setup.

## Acceptance criteria
- [ ] One source-language type: `SourceLang` (`tr`/`ru`/`fa`/`ar`) defined once and reused by `core/text`, `core/content`, `core/scheduler`, `core/learning-log`; `core/text`'s wider union renamed (e.g. `TextLang`)
- [ ] `compareByFrequency` (rank, then id) exported from `core/content` and used by `build.ts` and `scheduler`
- [ ] Scheduler never returns false-friend items (filter via `boardPool` or the same predicate), with a test
- [ ] Import policy written into the tech design and applied: core uses relative `.ts` imports; `games`/`ui`/`shell` use the `@core/*` aliases (apply to `games/juft`)

## Test-first plan
- Red: Unit: `nextItems` on a pool containing a false friend never returns it
- Property: `compareByFrequency` gives a total order (antisymmetric, transitive) over generated items

## Files likely touched
- `src/core/{text,content,scheduler,learning-log}/**`
- `src/games/juft/rules.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task Q8 (Consolidate duplicated types and helpers). Read CLAUDE.md and docs/tasks/Q8-type-helper-consolidation.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (Q1) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

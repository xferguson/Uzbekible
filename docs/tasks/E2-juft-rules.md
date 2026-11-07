# E2: Juft match rules on core/session

| | |
|---|---|
| Status | in review |
| Lane | E Juft engine |
| Read first | `docs/games/01-juft.md`, `docs/architecture.md` (rows you use) (other docs only if needed) |
| Depends on | [K3](K3-core-session.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/E2-juft-rules` |

## Goal
Pure rules reducer for selecting and matching tiles.

## Acceptance criteria
- [ ] Actions: `select(side, tileId)`, `hint(tileId)`; events: `selected`, `deselected`, `matched`, `mismatched`, `hintShown`, `complete`, `lifeLost`
- [ ] Same-tile tap deselects; same-column tap moves selection; cross-column pair evaluates
- [ ] Mismatch → `lifeLost`; all pairs matched → `complete`; combo counter tracked
- [ ] Shuffle of columns on level start via `core/random`

## Test-first plan
- Property: matched tiles never re-selectable; number of matched pairs ≤ pairs; complete iff all matched
- Unit: 3 mismatches → session `lost` (integration with K3)

## Files likely touched
- `src/games/juft/rules.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task E2 (Juft match rules on core/session). Read CLAUDE.md and docs/tasks/E2-juft-rules.md first, and follow the skills it lists (tdd-task, new-game-scaffold, pr-flow). Confirm that its dependencies (K3) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

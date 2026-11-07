# U5: Shared LevelMap (mosaic) + level select

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Depends on | [D2](D2-juft-mockups.md), [U1](U1-design-tokens-motif-ui.md), [K5](K5-core-storage.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `ui-component`, `tdd-task`, `pr-flow` |
| Branch | `task/U5-ui-level-map` |

## Goal
Mosaic facade progress map with replay of any unlocked level.

## Acceptance criteria
- [ ] Facade cells per level; stars set glaze depth; locked/unlocked/current states
- [ ] Select any unlocked level; shows best score
- [ ] Keyboard navigable; screen-reader labels “Level 7, 2 stars, best 1840”

## Test-first plan
- Unit: unlock logic reflects stored progress; locked cells not activatable

## Files likely touched
- `src/ui/LevelMap/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task U5 (Shared LevelMap (mosaic) + level select). Read CLAUDE.md and docs/tasks/U5-ui-level-map.md first, and follow the skills it lists (ui-component, tdd-task, pr-flow). Confirm that its dependencies (D2 and U1 and K5) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

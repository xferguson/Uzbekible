# U7: Juft end-to-end wiring

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [U4](U4-juft-board.md), [U5](U5-ui-level-map.md), [U6](U6-settings.md), [E1](E1-juft-levels.md), [E3](E3-juft-scoring-balance.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `new-game-scaffold`, `tdd-task`, `pr-flow` |
| Branch | `task/U7-juft-wiring` |

## Goal
Assemble generator → board → scoring → log → progress into a playable game.

## Acceptance criteria
- [ ] `src/games/juft/definition.ts` registered; Juft playable from home
- [ ] Level spec respects settings; results save best score and unlock next
- [ ] Learning-log events emitted per spec

## Test-first plan
- Integration test (Testing Library) with seed and fake clock plays level 1 and level 2

## Files likely touched
- `src/games/juft/definition.ts`
- `src/games/registry.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task U7 (Juft end-to-end wiring). Read CLAUDE.md and docs/tasks/U7-juft-wiring.md first, and follow the skills it lists (new-game-scaffold, tdd-task, pr-flow). Confirm that its dependencies (U4 and U5 and U6 and E1 and E3) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

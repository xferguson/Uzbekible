# U3: HUD, Countdown, Results, GameShell + registry

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [U1](U1-design-tokens-motif-ui.md), [K3](K3-core-session.md), [K5](K5-core-storage.md), [K6](K6-core-learning-log.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `ui-component`, `new-game-scaffold`, `tdd-task`, `pr-flow` |
| Branch | `task/U3-ui-shell-hud` |

## Goal
Everything every game gets for free.

## Acceptance criteria
- [ ] `Timer`, `Lives` (cracking tiles), `Score`, `LevelBadge`, `Combo`
- [ ] `Countdown`, `PauseOverlay` (hides board), `ResultsScreen` (stars, new best)
- [ ] `GameShell` hosting a `GameDefinition`; `src/games/types.ts`; `src/games/registry.ts`
- [ ] Shell writes progress/best scores via `core/storage` and attempts via `core/learning-log`

## Test-first plan
- Unit: shell with a fake GameDefinition runs countdown → play → won → results; best score only increases

## Files likely touched
- `src/ui/hud/**`
- `src/ui/screens/**`
- `src/shell/GameShell.tsx`
- `src/games/types.ts`
- `src/games/registry.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task U3 (HUD, Countdown, Results, GameShell + registry). Read CLAUDE.md and docs/tasks/U3-ui-shell-hud.md first, and follow the skills it lists (ui-component, new-game-scaffold, tdd-task, pr-flow). Confirm that its dependencies (U1 and K3 and K5 and K6) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

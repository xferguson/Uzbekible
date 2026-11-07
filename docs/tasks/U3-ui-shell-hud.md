# U3: HUD, Countdown, Results, GameShell + registry

| | |
|---|---|
| Status | done |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Screens owned | `juft-ready`, `juft-countdown`, `juft-pause`, `juft-results-3`, `juft-results-2`, `juft-results-1`, `juft-fail` |
| Depends on | [U1](U1-design-tokens-motif-ui.md), [K3](K3-core-session.md), [K5](K5-core-storage.md), [K6](K6-core-learning-log.md), [Q7](Q7-game-contract.md) |
| Skills | `ui-component`, `new-game-scaffold`, `tdd-task`, `pr-flow` |
| Branch | `task/U3-ui-shell-hud` |

## Goal
Everything every game gets for free.

## Acceptance criteria
- [ ] `Timer`, `Lives` (cracking tiles), `Score`, `LevelBadge`, `Combo`
- [ ] `Countdown`, `PauseOverlay` (hides board), `ResultsScreen` (stars, new best)
- [ ] `GameShell` hosting a `GameDefinition`; `src/games/registry.ts` (contract types come from Q7)
- [ ] Shell writes progress/best scores via `core/storage` and attempts via `core/learning-log`

## Test-first plan
- Unit: shell with a fake GameDefinition runs countdown → play → won → results; best score only increases

## Files likely touched
- `src/ui/hud/**`
- `src/ui/screens/**`
- `src/shell/GameShell.tsx`
- `src/games/registry.ts`

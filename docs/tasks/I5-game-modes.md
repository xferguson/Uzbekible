# I5: Per-game difficulty modes in the game contract and shell

| | |
|---|---|
| Status | done |
| Lane | I Imlo |
| Depends on | [U7](U7-juft-wiring.md) |
| Read first | `docs/games/06-imlo.md` ("Difficulty modes"), `src/games/types.ts`, `docs/architecture.md` (shell and games rows) |
| API used | `docs/api.md` § `core/storage`, `ui` (`LevelMap`) |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/I5-game-modes` |

## Goal
Let a game declare difficulty modes the player picks; the shell passes the mode through and keeps progress per mode.
Juft declares none and behaves exactly as today.

## Acceptance criteria
- [ ] `GameDefinition.modes?: readonly { id: string; name: { uzLatn: string; uzCyrl: string } }[]`; `LevelContext.mode?: string`
- [ ] The seed includes the mode when the game has modes (`<gameId>:<mode>:<level>:<settingsHash>`); Juft's seeds unchanged
- [ ] Progress stored per mode with a storage migration; existing Juft progress survives untouched
- [ ] The chosen mode is remembered per game; `multipliers` receives it
- [ ] A mode picker on the ready card only when a game has modes (layout from I4 if merged, else a plain segmented control)

## Test-first plan
- Red: `src/shell/progress.test.ts`: clearing level 3 in mode `qiyin` does not unlock level 4 in `oson`
- Unit: a game with no modes produces the same seed as before

## Files likely touched
- `src/games/types.ts`, `src/shell/GameShell.tsx`, `src/shell/progress.ts`, tests

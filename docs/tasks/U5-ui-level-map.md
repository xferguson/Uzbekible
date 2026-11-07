# U5: Shared LevelMap (mosaic) + level select

| | |
|---|---|
| Status | done |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Screens owned | `juft-map-early`, `juft-map-late` |
| Depends on | [D2](D2-juft-mockups.md), [U1](U1-design-tokens-motif-ui.md), [K5](K5-core-storage.md) |
| Skills | `ui-component`, `tdd-task`, `pr-flow` |
| Branch | `task/U5-ui-level-map` |

## Goal
Mosaic facade progress map with replay of any unlocked level.

## Acceptance criteria
- [x] Facade cells per level; stars set glaze depth; locked/unlocked/current states
- [x] 120 levels in 8 chapters (buildings) of 15, per D2: a skyline of all eight buildings above the current building's facade on phone, a chapter list on desktop; chapters and level counts come from config, not hard-coded
- [x] Select any unlocked level; shows best score
- [x] Keyboard navigable; screen-reader labels “Level 7, 2 stars, best 1840”

## Test-first plan
- Unit: unlock logic reflects stored progress; locked cells not activatable

## Files likely touched
- `src/ui/LevelMap/**`

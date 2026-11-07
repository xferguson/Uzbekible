# V9: Level map to D2

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V2](V2-layout-invariants.md), [V7](V7-juft-fidelity-audit.md) |
| Read first | `docs/design/fidelity-juft.md`, frames: `../design/mockups/screens/D2-phone-map-minora-levels-16-30-{light,dark}.png`, `../design/mockups/screens/D2-phone-map-registon-levels-106-120-{light,dark}.png`, `../design/mockups/screens/D2-desk-map-level-map-with-ready-card-{light,dark}.png`, `../design/mockups/screens/D2-desk-map-late-late-game-map-registon-{light,dark}.png`, `../design/mockups/screens/D2-phone-ready-ready-{light,dark}.png` (other docs only if needed) |
| API used | `core/motif` |
| Skills | `ui-component`, `design-fidelity-review`, `tdd-task`, `pr-flow` |
| Branch | `task/V9-juft-level-map` |

> **Approval gate:** don't merge until the user explicitly approves in the session, after seeing the comparison page. Label the PR `needs-approval`.

## Goal
Bring the level map up to D2: building icons in the skyline, the building facade around the level grid, star-coloured cells with pips, the legend, and the "Level N" play button and ready card.

## Acceptance criteria
- [ ] Skyline shows building icons with numbers and the cleared tick; no clipped labels at 320 px
- [ ] The current chapter renders as its building facade (roof, bands, base) around the level cells; cell colours encode stars as in D2, locked cells show the lock
- [ ] Legend and primary "Level N" button; desktop ready card
- [ ] Matches the owned frames at 360/390/1280, light and dark; design-reviewer reports no blocker or major; comparison in the PR

## Test-first plan
- Red: A LevelMap test for the legend and the play button's accessible name; V2 suite's map states

## Files likely touched
- `src/ui/LevelMap/**`
- `src/ui/motif/**` (building facades)

# U7: Juft end-to-end wiring

| | |
|---|---|
| Status | done |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Screens owned | `home` |
| Depends on | [U4](U4-juft-board.md), [U5](U5-ui-level-map.md), [U6](U6-settings.md), [E1](E1-juft-levels.md), [E3](E3-juft-scoring-balance.md) |
| Skills | `new-game-scaffold`, `tdd-task`, `pr-flow` |
| Branch | `task/U7-juft-wiring` |

## Goal
Assemble generator → board → scoring → log → progress into a playable game.

## Acceptance criteria
- [x] `src/games/juft/definition.ts` registered; Juft playable from home
- [x] Level spec respects settings; results save best score and unlock next
- [x] Learning-log events emitted per spec

## Test-first plan
- Integration test (Testing Library) with seed and fake clock plays level 1 and level 2

## Files likely touched
- `src/games/juft/definition.ts`
- `src/games/registry.ts`

# J5: Soxta board UI

| | |
|---|---|
| Status | todo |
| Lane | J Soxta |
| Depends on | [J4](J4-soxta-mockups.md), [J2](J2-soxta-rules.md), [J3](J3-ui-use-swipe.md), [U2](U2-ui-tile-text.md), [U3](U3-ui-shell-hud.md) |
| Read first | `docs/design/mockups/soxta/` (approved), `docs/games/05-soxta.md` ("Core loop") |
| API used | `docs/api.md` § `ui` (Tile, UzText, SourceText, HUD, Results) |
| Skills | `tdd-task`, `ui-component`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/J5-soxta-board` |

## Goal
The card screen built from shared tiles and HUD, driven by `useSwipe` and the J2 reducer.

## Acceptance criteria
- [ ] Uzbek word via `UzText` (Latin/Cyrillic setting), Turkish via `SourceText`; text only through `core/text`
- [ ] English clue shown only as the clue and in the reveal; nothing else on the board is English
- [ ] Swipe, tap-side and arrow keys all answer; reduced motion respected
- [ ] Per-card countdown and lives in the shared HUD; results use the shared Results screen
- [ ] Coverage ≥ 80% for `src/ui`

## Test-first plan
- Red: render a card, swipe toward the clued word, assert the correct state and the next card
- Unit: Cyrillic setting shows the Cyrillic Uzbek word

## Files likely touched
- `src/games/soxta/Board.tsx`, `src/games/soxta/Board.test.tsx`

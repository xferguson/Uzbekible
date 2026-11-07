# I6: Imlo board UI

| | |
|---|---|
| Status | on hold: awaiting approval of the Imlo plan (`docs/games/06-imlo.md`) |
| Lane | I Imlo |
| Depends on | [I4](I4-imlo-mockups.md), [I3](I3-imlo-rules.md) |
| Read first | `docs/design/mockups/I4-imlo-screens.html` (approved), `docs/games/06-imlo.md` ("Core loop", "Rules": Keyboard) |
| API used | `docs/api.md` § `ui` (`Tile`, `UzText`, `SourceText`, `useLongPress`, HUD) |
| Skills | `tdd-task`, `ui-component`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/I6-imlo-board` |

## Goal
The spelling board from shared tiles and HUD, driven by the I3 rules.

## Acceptance criteria
- [ ] Two slot rows, the clue under the check star, the bank; layout and states as approved in I4
- [ ] Uzbek via `UzText` (Latin/Cyrillic), source via `SourceText` (RTL for fa/ar); text only through `core/text`
- [ ] English only as the clue; the check label is Tekshir / Текшир
- [ ] Oson tints tiles by origin with a non-colour cue; Oʻrta and Qiyin do not
- [ ] Tap, long-press hint and keyboard (Tab, letters, Backspace, Enter, H) all work; reduced motion respected
- [ ] Coverage ≥ 80% for new UI

## Test-first plan
- Red: `src/games/imlo/Board.test.tsx`: tap the Turkish row, tap *i s i m*, tap the Uzbek row, tap *i s m*, press Tekshir; the next clue shows
- Unit: tapping a filled slot returns its tile to the bank

## Files likely touched
- `src/games/imlo/Board.tsx`, `src/games/imlo/Board.module.css`, tests

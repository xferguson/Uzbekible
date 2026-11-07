# U4: Juft board UI

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [D2](D2-juft-mockups.md), [U2](U2-ui-tile-text.md), [U3](U3-ui-shell-hud.md), [E2](E2-juft-rules.md) |
| Skills | `ui-component`, `uzbek-text-rules`, `tdd-task`, `pr-flow` |
| Branch | `task/U4-juft-board` |

## Goal
The two-column board with match/crack animations and the long-press hint.

## Acceptance criteria
- [ ] Two shuffled columns (source left, Uzbek right) from the rules state; responsive phone/desktop per D2
- [ ] Animations per D2 timings; reduced-motion alternatives
- [ ] Long-press shows English gloss briefly and dispatches `hint`
- [ ] No English rendered except during hint
- [ ] Supports **1 to 12 pairs**: all tiles visible without scrolling on a 390 × 844 phone and 1280 × 800 desktop; tile height from available height (96 px for 1 pair, 46 px at 12 on a phone), never below 44 px; from 10 pairs, 6 px gaps and 17 px tile type, per D2

## Test-first plan
- Unit: tapping a correct pair dispatches select×2 and renders matched state; wrong pair shows cracked state; no `glossEn` text in DOM without hint

- Unit/e2e: a 12-pair board fits a 390 × 844 viewport with every tile ≥ 44 px tall and no scroll; long words (e.g. `преподаватель`, `oʻqituvchilar`) don't overflow a tile

## Files likely touched
- `src/games/juft/Board.tsx`
- `src/games/juft/*.module.css`

# I4: Imlo screen mockups (GATE)

| | |
|---|---|
| Status | in review |
| Lane | I Imlo |
| Depends on | [D1](D1-design-system-mockups.md) |
| Read first | `docs/games/06-imlo.md` (all), `docs/design/brief.md`, `docs/design/mockups/D2-juft-screens.html` (board, HUD, map) |
| API used | none |
| Skills | `design-mockup`, `pr-flow` |
| Branch | `task/I4-imlo-mockups` |

## Goal
Mockups for the Imlo board in every state, so the board task has an approved target.

## Approval gate
🔒 The user approves the mockups in the session (`needs-approval` label) before I6 starts.

## Acceptance criteria
- [ ] Phone (390 × 844) and desktop (1280 × 800): ready card with Oson / Oʻrta / Qiyin, board, check star with **Tekshir**, results, fail
- [ ] Board states: empty, active side, partly filled, both full (star enabled), correct, wrong on one side, hint in progress, paused
- [ ] Oson colouring with a non-colour cue (shape or edge mark); contrast checked with `contrast.mjs`
- [ ] Largest case fits without scrolling: 8 + 8 letters + 4 distractors (20 tiles), tiles ≥ 44 px
- [ ] Persian and Arabic: RTL slot row of separate isolated-form tiles, the same as other languages; no joined preview (decision 2)
- [ ] Chapter building names for the level map; reduced-motion replacements for every animation
- [ ] Decisions recorded in `docs/games/06-imlo.md` ("Approved decisions")

## Test-first plan
Docs-only: validated by the user's approval and by `contrast.mjs` passing for any new colour pair.

## Files likely touched
- `docs/design/mockups/I4-imlo-screens.html`, `docs/design/mockups/screens/I4-*.png`, `docs/games/06-imlo.md`

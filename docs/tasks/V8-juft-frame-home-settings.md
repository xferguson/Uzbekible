# V8: App frame, home and settings to D2

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V2](V2-layout-invariants.md), [V7](V7-juft-fidelity-audit.md) |
| Read first | `docs/design/fidelity-juft.md`, frames: `../design/mockups/screens/D2-phone-home-home-and-game-picker-{light,dark}.png`, `../design/mockups/screens/D2-desk-home-home-{light,dark}.png`, `../design/mockups/screens/D2-phone-settings-settings-{light,dark}.png`, `../design/mockups/screens/D2-desk-settings-settings-{light,dark}.png` (other docs only if needed) |
| API used | none |
| Skills | `ui-component`, `design-fidelity-review`, `tdd-task`, `pr-flow` |
| Branch | `task/V8-juft-frame-home-settings` |

> **Approval gate:** don't merge until the user explicitly approves in the session, after seeing the comparison page. Label the PR `needs-approval`.

## Goal
Bring the page frame (header bar, back button, motif band, star total) and the home and settings screens up to D2.

## Acceptance criteria
- [ ] A shared page-frame component in `src/ui` (header with back button, title, star count; motif band from `ui/motif`) used by every non-board screen
- [ ] Home: game picker cards as in D2 (no bare buttons); settings as in D2
- [ ] Matches the owned frames at 360/390/1280, light and dark; design-reviewer reports no blocker or major; comparison in the PR
- [ ] Home includes Imlo as a second game card in the same style (no D2 counterpart; flag to the user); two-column desktop home with the "your city" panel
- [ ] Settings: cards per group (source-language toggles with native name, gloss and example; script segmented control with hard chip; motion and theme segmented controls), token-styled controls, readable unselected state in dark; add the phone settings frame to `docs/design/frames.json`
- [ ] Layout suite (V2) green for these states

## Test-first plan
- Red: A Testing Library test that the page frame renders a header with a labelled back button and the motif band; the V2 suite's home and settings states

## Files likely touched
- `src/ui/PageFrame/**`
- `src/shell/App.tsx`, `App.module.css`
- `src/ui/SettingsPanel/**`

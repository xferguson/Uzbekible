# V10: Results, countdown, pause, fail and board polish to D2

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V2](V2-layout-invariants.md), [V7](V7-juft-fidelity-audit.md) |
| Read first | `docs/design/fidelity-juft.md`, frames: `../design/mockups/screens/D2-phone-results-3-new-best-{light,dark}.png`, `../design/mockups/screens/D2-phone-results-1-{light,dark}.png`, `../design/mockups/screens/D2-phone-count-3-{light,dark}.png`, `../design/mockups/screens/D2-phone-pause-pause-{light,dark}.png`, `../design/mockups/screens/D2-phone-fail-fail-third-strike-{light,dark}.png`, `../design/mockups/screens/D2-phone-board-12-pairs-mid-play-{light,dark}.png`, `../design/mockups/screens/D2-desk-results-results-3-new-best-{light,dark}.png` (other docs only if needed) |
| API used | none |
| Skills | `ui-component`, `design-fidelity-review`, `tdd-task`, `pr-flow` |
| Branch | `task/V10-juft-results-overlays-board` |

> **Approval gate:** don't merge until the user explicitly approves in the session, after seeing the comparison page. Label the PR `needs-approval`.

## Goal
Bring the results card (star medallions, stat grid, actions), the countdown, pause and fail overlays, and any board gaps found by the audit up to D2.

## Acceptance criteria
- [ ] Results as in D2 for 1, 2 and 3 stars and new best; fits 320 px
- [ ] Countdown, pause (board hidden) and fail overlays as in D2
- [ ] Board gaps from `fidelity-juft.md` fixed (HUD, tile states, hint)
- [ ] Matches the owned frames at 360/390/1280, light and dark; design-reviewer reports no blocker or major; comparison in the PR

## Test-first plan
- Red: V2 suite's results/overlay states plus a ResultsScreen test for the star medallions' accessible labels

## Files likely touched
- `src/ui/screens/**`
- `src/ui/hud/**`
- `src/games/juft/Board.*`

# D2: Game 1 (Juft) screen mockups (GATE)

| | |
|---|---|
| Status | done |
| Lane | B Design |
| Read first | `docs/design/brief.md` (other docs only if needed) |
| Depends on | [D1](D1-design-system-mockups.md) |
| Skills | `design-mockup`, `pr-flow`, `uzbek-text-rules` |
| Branch | `task/D2-juft-mockups` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Design every Juft screen and interaction using the approved design system, for user approval.

## Acceptance criteria
- [ ] Screens (phone first + desktop, light + dark): home/game picker, Juft level map (mosaic facade), pre-level ready, countdown, board (2 columns, 1/3/6/8 pairs), pause (tiles hidden), results (1–3 stars, new best), fail (3 strikes), settings (source-language toggles, Uzbek script)
- [ ] Interaction storyboards: select → correct match → girih star bloom → dissolve; wrong → crack + shake + life crack; long-press English hint; reduced-motion versions
- [ ] Board samples for Turkish, Russian, Persian (RTL), Arabic (RTL) sources; Uzbek in Latin and Cyrillic
- [ ] Animation timings listed (ms) consistent with brief §7
- [ ] No English on board except the long-press hint state
- [ ] Published as Artifact; PR labelled `needs-approval`; approved decisions appended to `docs/games/01-juft.md`

## Test-first plan
- n/a (design task)

## Files likely touched
- `docs/design/mockups/D2-*.html`
- `docs/games/01-juft.md`

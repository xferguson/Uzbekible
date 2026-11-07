---
name: design-fidelity-review
description: Use when a PR changes what the app looks like (src/ui, src/games, src/design, CSS, layout) or before merging any V-lane/UI task: compare app screenshots with the approved D2 mockup frames against a fixed checklist and record a mismatch table.
---

# Design fidelity review

Agents must not grade their own visual work. The implementing agent produces the screenshots; an independent
`design-reviewer` subagent (`.claude/agents/design-reviewer.md`) compares them with the approved mockups and returns
a mismatch table. This skill is the checklist and the procedure.

## Procedure
1. **Shoot.** `npm run shots` (or `npm run shots -- --states juft-map,juft-results` for the screens you touched). Output:
   `shots/<state>-<width>-<scheme>.png`, approved frames copied to `shots/frames/`, side-by-side page
   `shots/compare.html`. Pairs come from `docs/design/frames.json` (the frame map). Widths 360, 390 (phone frames) and
   1280 (desktop frames); light and dark.
2. **Spawn the `design-reviewer` subagent** (not yourself) with: the `shots/` path, the frame map path, and the list of
   states to cover. Do not pass your own opinion of the result. It replies with the table only.
3. **Fix** every blocker and major, re-shoot, and run the reviewer again until none remain. Minors may stay if
   listed in the PR.
4. **Paste the final table into the PR** under "Design fidelity", plus the `compare.html` Artifact link when the user
   should look. A PR with a visual change and no table is not ready.
5. **Merge gate:** never merge with a blocker or major open. 🔒 design tasks still need the user's approval too.

## Checklist (go through every item for every pair)
| # | Area | Look for |
|---|---|---|
| 1 | Page frame and header | App bar height, rosette band under it, back/title/HUD placement, safe-area padding, background lattice strength |
| 2 | Motif band | Rosette/girih bands present where the mockup has them, same repeat, colours, cut-off at the edges |
| 3 | Type | Family, weight, size and line height match tokens (`src/design/tokens.ts`); correct script font for Latin/Cyrillic/Persian/Arabic |
| 4 | Spacing | Gutters, gaps between tiles/cards, padding inside cards, vertical rhythm; compare by measured pixels, not impression |
| 5 | Colours | Ground, surface, cobalt, turquoise, gold used in the same places; no hard-coded off-token colours |
| 6 | Illustrations | Map buildings/facade (dome, minaret, iwan, Registan), icons, stars: present, same shape and fill state |
| 7 | States | Every state the frame map lists for the screen exists and looks right: idle, selected, correct, wrong/crack, disabled, focus, locked/current/done levels, 0–3 stars |
| 8 | Overflow and clipping | Text cut off or wrapped differently, cards taller than the viewport, horizontal scroll, content under fixed bars |
| 9 | Dark mode | Same checks in dark; contrast of text and gold on cobalt; no light-only assets |
| 10 | 360 px | Narrowest phone: nothing overlaps, tap targets ≥ 44 px, no horizontal scroll |
| 11 | Product rules | No English on boards; RTL mirrored for Persian/Arabic; state never by colour alone |

A state with no mockup frame (flagged on `compare.html`) cannot be graded for fidelity: list it as
`no frame · <state> · mockup missing` severity **minor** and still check items 8–10 on the app shot alone.

## Severity
- **blocker**: screen unusable or wrong at a glance (content missing, unreadable, overflowing off-screen, broken in dark/360).
- **major**: clearly different from the mockup in a way a user would notice (missing band or illustration, wrong layout, wrong palette use).
- **minor**: small deviation (a few px of spacing, a slightly different weight).

## Mismatch table (the only output format)
```
| Frame | What differs | Severity |
|---|---|---|
| juft-map-early · 390 · light | App bar has no rosette band; mockup has one under the bar | major |
```
Frame = `<state> · <width> · <scheme>`. One row per distinct difference; merge the same difference across widths or
schemes into one row ("390/360 · light/dark"). "What differs" says what the app shows and what the mockup shows,
with a measured value where there is one. Empty table → write `No mismatches`.

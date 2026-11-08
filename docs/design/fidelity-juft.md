# Juft design-fidelity audit against D2 (V7)

Source: `npm run shots` on `main` (96 Juft shots plus home and settings), graded by the independent `design-reviewer`
against `docs/design/frames.json`. Widths 360, 390, 1280; light and dark. Compare page: [compare page (Artifact)](https://claude.ai/artifact/JCwdg4VRNA7NB7mgSHocfD).

This file is the list of **shell-owned** gaps (`design-fidelity-review`, "Shell chrome vs game content"). A gap not
listed here is game-owned. Owners: V8 = page frame, home, settings · V9 = level map and ready card · V10 = results,
countdown, pause, fail, board/HUD · V11 = final re-audit.

## Root cause
Almost every row below traces to one thing: **no shared page frame**. There is no cobalt app bar with chevron back
button, no rosette band, and the HUD, overlays and map are unstyled. V8's `PageFrame` unblocks most of the rest.

## Mismatch tables

### Home and settings (owner V8)
| Frame | What differs | Severity | Owner |
|---|---|---|---|
| home · all | No app bar: mockup has cobalt bar, gold star logo, wordmark, settings icon button, rosette band; app has a bare wordmark on lattice | blocker | V8 |
| home · all | Picker is two bare outlined bars plus a "Sozlamalar" pill; mockup has greeting, Juft card (icon, level, stars, total), full-width continue CTA, "coming later" dashed cards with locks. ~55% of phone viewport empty. Imlo has no mockup counterpart | major | V8 |
| home · 1280 | Single ~540 px column; mockup is two columns with a "your city" panel (chapter strip, caption) on the right | major | V8 (city panel data from V9 strip) |
| home · 360/390 | Wordmark ~56 px cap height vs ~36 px in mockup | minor | V8 |
| settings · 1280 | No app bar/chevron/title or rosette band; title in plain sans inside a card, not the serif display face | blocker | V8 |
| settings · 1280 | One card with native checkboxes/radios; mockup has separate cards: source languages with toggles, native name, gloss and example; Uzbek script segmented control with "hard ×1.25" chip; motion and theme segmented controls. No motion option; all four languages on (mockup shows two off) | major | V8 |
| settings · 1280 | Native controls off tokens; in dark the unselected state is low contrast; card runs below the fold and the last option is clipped | major | V8 |
| settings · 360/390 | No phone frame (frames.json phone list empty); no bar or band; no bottom padding. Fits at 360 | minor | V8 (also add a phone frame mapping, see below) |

### Level map and ready (owner V9)
| Frame | What differs | Severity | Owner |
|---|---|---|---|
| juft-map-early · all | No app bar or rosette band (back is an "Orqaga" outlined button) | blocker | V8 |
| juft-map-early · all | No chapter-strip building icons with ticks and caption; text tabs ("Gumbaz 15"…) clip at the right edge; no facade art; no star legend; no "Level 24" CTA | blocker | V9 |
| juft-map-early · all | Flat 3-column grid of diamonds on a navy block; mockup has star rosette rows, lock glyphs, a "next" cell with a play triangle; the block ends mid-page, ~40% viewport empty | major | V9 |
| juft-map-late · all | Same gaps as early; no Registon facade (arches, domes), no legend, no "Level 113" CTA; current level 110 vs 113 in mockup (fixture or logic, check) | blocker | V9 |
| juft-map-late · dark | Cell block open-bottomed and cut off, empty ground below | minor | V9 |
| juft-ready · all | No ready card: app shows a bare "3" with back and X. Mockup: gold 8-point star with level, heading, Pairs/Par/Best cards, script chips, Start CTA | blocker | V9 |

### Countdown, board, overlays, results (owner V10)
| Frame | What differs | Severity | Owner |
|---|---|---|---|
| juft-countdown · all | Bare numeral; mockup has dimmed board behind a HUD bar and a gold octagonal star holding "3" / "Boshla!" | blocker | V10 |
| juft-board-* · all | HUD is a plain pill row with a default-style "Pauza" box; mockup has bar with pause icon, level octagon, life/crack glyphs, timer, combo pill, score, rosette band. Crowded at 360 | blocker | V10 (bar/band part: V8) |
| juft-board-* · all | Tiles in two ordered columns with a "TR" badge, ~130 px tall; mockup mixed grid, soft gradient and shadow, ~78 px at 390; no matched dashed-star slots, no gold selected fill | major | V10 |
| juft-wrong · 360/390 | Wrong state shows no tile crack or life-glyph crack and no "-5" delta; state not conveyed by shape | major | V10 |
| juft-hint · 360/390 | Small dark tooltip overlapping the HUD; mockup has anchored tooltip with arrow, "-5" chip and gold-ringed tile | major | V10 |
| juft-pause · all | Plain heading and two pill buttons on flat ground; mockup is a card over dimmed board with label, note, Resume CTA, Restart and Map; Restart missing | blocker | V10 |
| juft-fail · all | Plain white card at top of page; mockup is a centred card over dimmed board with three cracked glyphs, heading, stats row, full-width buttons | blocker | V10 |
| juft-results-3 · 1280 | Small card pinned to top; mockup has heading, rosette stars, "new best" chip, large score with previous, stat row, glazed line, three actions, centred | blocker | V10 |
| juft-results-3 · 360/390 | No phone frame mapped; card not centred, unstyled | minor | V10 |
| juft-results-2, juft-results-1 · all | No mockup frame mapped (D2 phone results-1 / results-3 exist on disk but are not in the frame map) | minor | V10 (map frames) |

### Cross-cutting
| Frame | What differs | Severity | Owner |
|---|---|---|---|
| all screens · all | App bar is an outlined "Orqaga" text button plus plain title; mockup has cobalt bar, square chevron button, rosette band, safe-area inset. Height ~85 px vs ~130 px at 390 | major | V8 |
| all game screens · dark | Rosette band and cobalt bar absent in dark, same as light | major | V8 |
| all · all | Reviewer noted English UI strings in mockup frames (Resume, Restart, Map, Next) vs Uzbek in app. Not a defect: product rule is no English on boards; mockups are annotated | minor | none |

## Scope found outside V8–V10
- **Frame map gaps** (`docs/design/frames.json`): no phone frame for settings; none for results-1/2/3 phone, board-8 phone, juft-wrong desktop, hint/board desktop. Phone PNGs for results exist in `docs/design/mockups/screens/`. Added to V10 (results) and V8 (settings) as "map the frames".
- **Imlo on home** has no D2 counterpart; V8 should place it as a second game card in the same style and flag it for the user.
- **Map fixture mismatch** (level 110 vs 113) to be checked in V9.
- **Settings motion option** is new functionality (reduced-motion setting); V8 covers the control, using the existing preference if there is one.

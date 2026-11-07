# Game 1: Juft (Pair Match)

> *juft* (Uzbek) = pair, a cognate of Turkish *çift*. Working title.

**Status:** approved for build (behind design gates D1 and D2) · **Tasks:** see `../tasks/README.md`

## Pitch
Two columns of glazed tiles: Turkish (or Russian, Persian, Arabic) on the left, Uzbek on the right. Tap a pair
that means the same thing and the two tiles lock into a golden girih star and disappear. Beat the clock, don't
crack your tiles, clear the level, and watch your mosaic grow. No lessons, just speed.

## Core loop
1. **Level select / mosaic map.** Pick any unlocked level, or continue at the latest one.
2. **Ready → "Go!"** A countdown, then the timer starts.
3. **Match.** Tap a tile in one column, then a tile in the other (in either order).
   - **Correct:** the tiles lock together into a gold-edged girih star, then disappear from both columns. The
     correct pair is logged. (Later: the Uzbek word is spoken.)
   - **Wrong:** both tiles shake, a point penalty applies, and one **life** (of 3) cracks. The selection clears.
   - Tapping the same tile again deselects it. Tapping another tile in the same column moves the selection there.
4. **Clear the board → results:** time, mistakes, hints, score, stars (1–3), "new best!" if beaten.
   The next level unlocks. Options: Next / Replay / Map.
5. **Third strike → fail:** "Try again" restarts the same level with a fresh shuffle and the same items. No
   partial score is saved.

## Rules
| Rule | Value (v1, tunable in config) |
|---|---|
| Lives | 3 per level attempt |
| Mistake penalty | −points (config) + 1 life |
| Long-press hint | Reveals the English gloss on that tile for ~1.5 s. −points (config). Doesn't cost a life. Logged |
| Timer | Counts up from "Go". Shown in the HUD |
| Score | `core/scoring` with time decay vs. a par time, minus penalties and hint costs, plus a combo bonus for consecutive correct matches. Never below 0 |
| Stars | 3 thresholds per level, derived from par time and mistakes |
| Unlock | Clearing level *n* unlocks *n+1*. Any unlocked level is replayable. The best score per level is kept |
| Pause | Pausing freezes the timer and **hides the tiles** (so pausing can't be used to cheat) |

## Level progression (initial curve, validated by simulation)
| Levels | Pairs on board | Content |
|---|---|---|
| 1 | 1 | Very transparent cognates (men ↔ ben) |
| 2–3 | 2 | Pronouns, numbers |
| 4–10 | 3 → 5 | Top-frequency cognates and shared loans |
| every ~5th | 1 | A **hard pair**: an irregular or opaque cognate (ev ↔ uy), as a breather that teaches |
| 11–30 | 5 → 8 | More frequency bands. Lower-"transparency" pairs come in gradually |
| 31+ | 6 → 8 | **Suffixed forms** (evde ↔ uyda, geldim ↔ keldim) mixed with lemmas |

- **Item order:** Uzbek frequency rank (top 1000), filtered to items with at least one source in the **enabled**
  source languages. Items the player missed are re-shown by `core/scheduler` in later levels.
- **Difficulty knobs** (`core/difficulty`): pair count, the "transparency" mix (from `core/similarity`), par
  time, and the share of suffixed forms.
- **Determinism:** seed = `juft:<level>:<settingsHash>`. The same level with the same settings deals the same
  items, and every attempt gets a fresh shuffle.

## Settings that affect Juft
- **Source languages:** Turkish (on by default), Russian, Persian, Arabic. At least one must be on.
  - With more than one on, each pair still shows **one** source word. The language is chosen per item
    (preferring Turkish when available) and labelled with a small script badge on the tile.
- **Uzbek script:** Latin (default) or Cyrillic. Cyrillic is labelled as a hard mode and earns a score multiplier (config).
- Source words always appear in their native script. Persian and Arabic tiles are RTL.

## Content (v1)
- Pairs are drawn from `content/items/*.yaml` (see the `add-content-items` and `cognate-research` skills).
- Relation types: `turkic-cognate`, `shared-arabic`, `shared-persian`, `russian-loan`, `persian-loan`,
  `arabic-loan`. False friends are excluded from boards.
- Target: as many of the top-1000 Uzbek lemmas as have an enabled-language partner, plus a suffixed-forms set.

## Visual design hooks (detailed in mockup task D2)
- Tiles are majolica tiles: cobalt, turquoise and white, with a glaze highlight.
- Selected: a gold border. Matched: the two tiles slide together and form an 8-point girih star that glows and dissolves.
- Wrong: crack lines across both tiles plus a shake; one life tile in the HUD cracks.
- Level map: a building facade (dome → minaret → iwan → Registan) made of mosaic cells; each cleared level fills
  a cell, and stars set its glaze intensity.
- Reduced motion: no slides or shakes. Instant state changes with outlines and icons.

## Learning-log events
`level_start`, `match_correct {itemId, sourceLang, rtMs}`, `match_wrong {leftItemId, rightItemId, rtMs}`,
`hint_used {itemId}`, `level_complete {score, timeMs, mistakes, hints}`, `level_failed`.

## Out of scope (v1)
Audio, mixed mosaic-grid mode, stats screen, leaderboards.

## Open questions
- Should a hard pair show both options as a 1-pair board (instant), or a 1-pair board plus distractors?
  (Proposal: 1 pair, no distractors, and a "new pattern" glow.)
- Should the combo multiplier be visible? (Proposal: yes, as a small gold counter.)

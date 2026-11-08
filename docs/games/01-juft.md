# Game 1: Juft (Pair Match)

> *juft* (Uzbek) = pair, a cognate of Turkish *çift*. Working title.

**Status:** approved for build (design gates D1 and D2 passed) · **Tasks:** see `../tasks/README.md`

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
120 levels in eight chapters of 15. Each chapter is one building on the level map. The board grows to a maximum of
**12 pairs** (12 source tiles × 12 Uzbek tiles); after that, difficulty comes from content and par time, not size.
Revised in D2 at the user's request (was 8 pairs maximum).

| Chapter | Levels | Pairs on board | Content |
|---|---|---|---|
| 1 Gumbaz (dome) | 1–15 | 1 → 4 | Very transparent cognates (men ↔ ben), pronouns, numbers |
| 2 Minora (minaret) | 16–30 | 4 → 6 | Top-frequency cognates and shared loans |
| 3 Ayvon (iwan) | 31–45 | 6 → 7 | Next frequency bands; lower-"transparency" pairs come in gradually |
| 4 Darvoza (gate) | 46–60 | 7 → 8 | Russian, Persian and Arabic loans in the mix |
| 5 Madrasa | 61–75 | 8 → 9 | **Suffixed forms** begin (evde ↔ uyda, geldim ↔ keldim), mixed with lemmas |
| 6 Maqbara (mausoleum) | 76–90 | 9 → 10 | More suffixed forms; opaque cognates |
| 7 Masjid (mosque) | 91–105 | 10 → 11 | Lower transparency, shorter par time |
| 8 Registon | 106–120 | 12 | Full board: hardest transparency mix, highest suffixed share, tightest par |
| every ~5th | | 1 | A **hard pair**: an irregular or opaque cognate (ev ↔ uy), as a breather that teaches |

- **Board focus (E4).** Most levels are the usual frequency-ordered mix. Two kinds make the player read closely:
  **look-alike** boards (every 3rd level from 16) deal words spelled alike (giymek ↔ kiymoq, girmek ↔ kirmoq, gitmek ↔
  ketmoq), and **suffix-family** boards (every 4th level from 61) deal one stem with different suffixes (göz ↔ koʻz,
  gözden ↔ koʻzdan, gözüm ↔ koʻzim). Hard-pair breathers stay as they are. Schedule: `focusFor` in `difficulty.config.ts`.
- **Board fit:** all pairs are always on screen; the board never scrolls. On a 390 × 844 phone, 12 pairs give
  46 px tiles (gaps 6 px, tile type 17 px from 10 pairs up). Tiles never go below 44 px. See the D2 mockup.
- **Content volume:** 120 levels average about 8 pairs, roughly 950 board slots. The top-1000 lemmas plus the
  suffixed-forms set cover this, with `core/scheduler` re-showing missed items.
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

## Later
- Results screen lists the words just played with their meanings (task U9, parked).

## Out of scope (v1)
Audio, mixed mosaic-grid mode, stats screen, leaderboards.

## Open questions
- Should a hard pair show both options as a 1-pair board (instant), or a 1-pair board plus distractors?
  (Proposal: 1 pair, no distractors, and a "new pattern" glow.)
- Should the combo multiplier be visible? (Proposal: yes, as a small gold counter.)

## Approved decisions (D2)
Approved by the user on 2026-11-07 (task D2, PR #12). Reference mockup: `../design/mockups/D2-juft-screens.html`
(screens in `../design/mockups/screens/D2-*.png`). These settle the open questions above.

1. **Screens and flow:** home, level map, ready, countdown, board, pause, results, fail, settings, as in the mockup.
   On desktop the map and the ready card share one view.
2. **HUD** is numbers and icons only (pause, level octagon, three life tiles, timer, combo, score), so nothing on the
   board screen is English. Screen-reader labels are the exception.
3. **Board size** tops out at **12 pairs** (Registon, levels 106–120). Tile height comes from the available height:
   96 px for 1 pair, 66 px at 8, 46 px at 12 on a 390 × 844 phone (49 px on 1280 × 800), never below 44 px. From 10
   pairs, gaps are 6 px and tile type 17 px. The board never scrolls.
4. **Columns:** source on the left, Uzbek on the right, for every language, RTL included. Each column is shuffled on
   its own.
5. **Matched tiles** leave a dashed socket; nothing reflows.
6. **Input is never locked:** other tiles stay tappable while a match or crack animation plays.
7. **Hidden tiles** are face-down glazed tiles (cobalt-deep with a star) during the countdown and pause. Pause hides
   them instantly in every motion setting.
8. **Long-press hint:** a 450 ms hold fills a gold ring, then the English gloss shows for 1500 ms and costs points. A
   hold never selects. Keyboard: H.
9. **Mixed languages:** a badge in the language's own script (TR, РУ, فا, عر) at the source tile's inline-start corner.
10. **Hard pair** (open question 1): a one-pair board, no distractors, with a turquoise "Yangi naqsh" glow.
11. **Combo counter** (open question 2): visible, as a gold ×N pill from the second correct match in a row; it resets
    on a mistake.
12. **Level map:** a city of eight buildings, 15 levels each (see Level progression). A skyline of all eight sits above
    the current building's facade on phone; on desktop it is a chapter list. Levels climb upward; a cleared cell's
    glaze shows its stars (white 1, turquoise 2, gold 3) with star pips as the shape cue.
13. **Results:** Next / Replay / Map, with a gold "Yangi rekord!" ribbon for a new best; heading by stars (Barakalla,
    Yaxshi, Oʻtdingiz). **Fail:** "Yana!", Try again (same words, new shuffle) or Map; no score saved.
14. **Settings:** source languages named in their own script; the last one on cannot be turned off. Uzbek script as
    Lotin / Кирилл, with Cyrillic tagged hard mode. Motion and theme follow the system unless set.
15. **New token** `--on-gold` (#0A1838, both themes): dark text on gold and turquoise fills. Checked in
    `../design/mockups/contrast.mjs`.
16. **Motion timings** as in the mockup's timing table, held as shared constants in `src/ui` (U1), never hard-coded
    in a game. Every animation has the reduced-motion replacement listed there.

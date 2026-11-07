# Game 4: Eshit (Listen & Search)

> *eshit-* (Uzbek) = to hear, a cognate of Turkish *işit-*. Working title. **Status: backlog. Needs audio.**

## Pitch
A word search on a grid of glazed letter tiles, with a twist: you're never *shown* the word. You **hear** it.
Find the spelling of what you just heard and trace it on the grid. Replay the audio any time. Every word found
lights up as a band of tile ornament across the grid.

## Core loop (draft)
1. A grid of Uzbek letters (digraphs sh, ch, ng, oʻ, gʻ each occupy **one cell**, via `core/text` `toLetters`).
2. Audio plays the target word. A replay button is always available (replays may cost a little time or score; config).
3. Drag across cells (straight lines in 8 directions) to select. Correct: the word is found, its cells glaze gold,
   and the next word plays. Wrong: a gentle penalty.
4. Find all N words before the timer ends. Levels grow the grid, add words, allow diagonals and reversed words,
   and move to lower-frequency bands.
5. Script toggle: the grid can be Latin or Cyrillic (Cyrillic = hard mode).

## Trains
Listening, and mapping sound to spelling (especially vowels oʻ/u/o, q vs k, gʻ vs g, h vs x).

## Dependencies on shared modules
`core/audio` (AudioProvider), `core/text` (letters, scripts), `core/random` (grid generation), a new
`core/grid` (word-search placement with property tests: every word placeable, found paths valid),
`core/session`, `core/scoring`, `core/difficulty`, `ui/Tile`, `ui/usePathSelect`, `core/learning-log`.

## Open questions and risks
- **Audio source** (spike **S1**): pre-generated neural TTS (e.g. Azure uz-UZ voices) vs. openly licensed human
  recordings (Wikimedia Commons / Lingua Libre) vs. our own recordings. Coverage, quality and license.
- Should distractor words that sound similar sit in the grid (koʻl vs qoʻl)? That's great for ear training but harder.
- Also allow a Turkish audio → Uzbek spelling mode?

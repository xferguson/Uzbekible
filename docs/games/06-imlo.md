# Game 6: Imlo (Cognate Spelling)

> *imlo* (Uzbek) = spelling, orthography. It is itself a cognate: Turkish *imla*, Persian *emlâ* (املا), Arabic
> *imlāʼ* (إملاء, dictation). Working title. **Status: approved plan** (2026-11-07). Build before Soxta.
> Tasks: I1–I8 in `../tasks/README.md`.

## Pitch
Juft's production twin. One cognate pair at a time: an English meaning in the middle, two rows of empty letter
slots (the source word on one side, the Uzbek word on the other) and a shuffled bank holding the letters of
**both** words. Tap a side, tap letters to spell it, do the same for the other side, then press the star to check.
Get both right and the next pair slides in.

Juft asks "do you recognise that these mean the same thing?" Imlo asks "can you *produce* both spellings, and do you
know exactly where they differ?" Example, *name*: Turkish **isim**, Uzbek **ism**; the bank is `i s i m i s m`, all
shuffled. The player has to know that the Uzbek word drops the second *i*.

## Core loop
1. **Pair appears.** The English clue sits in the centre under an 8-point star. Above and below (phone) or left and
   right (desktop) are the source slot row and the Uzbek slot row; the number of slots is the word's letter count.
   Below everything sits the letter bank.
2. **Pick a side.** Tap a slot row to make it active (gold outline). The source side is active when a pair starts;
   when the active side fills, the other side becomes active automatically if it has empty slots.
3. **Spell.** Tapping a bank tile moves it into the first empty slot of the active side. Tapping a filled slot
   sends that tile back to the bank and leaves the slot empty (the next letter fills it). Nothing reflows.
4. **Check.** The star between the sides is the check button, labelled **Tekshir** (Cyrillic **Текшир**). It is
   enabled only when every slot on both sides is full.
   - **Both right:** the slot rows glaze gold, lock into the star, and the next pair slides in.
   - **Wrong:** each wrong side shows a crack and shakes (a right side glazes, so the player knows which side to
     fix); one life is lost. Letters stay where they are, so the player edits rather than starts over.
5. **Level = a run of pairs** (5 at first, up to 8). Clear them all: results, stars, next level. Third strike: fail,
   "Yana!", same pairs with a fresh shuffle.

Correctness is by **letter value, not tile identity**: any *i* tile can fill any *i* slot, on either side. Easy
mode's colours (below) are a hint, never a constraint, so a Turkish-coloured *i* in the Uzbek word still counts.

## Difficulty modes
Chosen on the ready card, remembered per player, part of the level seed, and with progress kept per mode.

| Mode | Bank | Colour | Score multiplier |
|---|---|---|---|
| **Oson** (easy) | exactly the letters of both words | each tile tinted by its word: turquoise for the source, cobalt for Uzbek (with a shape cue, not colour alone) | ×1 |
| **Oʻrta** (medium) | exactly the letters of both words | all tiles the same glaze | ×1.25 (config) |
| **Qiyin** (hard) | both words plus **distractor letters** (2 → 4 by level, config) | same glaze | ×1.5 (config) |

**Distractors** are chosen to be tempting, not random: first the *other side's* counterpart of a sound
correspondence that the pair uses (Turkish *ş* ↔ Uzbek *sh*, *ç* ↔ *ch*, *ğ* ↔ *gʻ*, *ö* ↔ *oʻ*, *ü* ↔ *u*,
*ı* ↔ *i*, *e* ↔ *a*, *k* ↔ *q*, *a* ↔ *o*), then letters from the same alphabet, from a confusables table in the
game config (data, not code). A distractor is never a letter that would make another valid spelling.

**Scripts that differ.** With Russian (Cyrillic) or Persian/Arabic (Arabic script) against Uzbek Latin, the script
already tells the two words apart, so Oson and Oʻrta play alike; the challenge comes from Qiyin's same-script
distractors. With Uzbek Cyrillic against Russian the two words share a script again, so colour matters.

## Rules
| Rule | Value (v1, tunable in config) |
|---|---|
| Lives | 3 per level attempt; a wrong check costs one, however many sides are wrong |
| Wrong check | −points (config) + 1 life; letters stay in place |
| Long-press hint | Hold an empty slot: the correct letter drops in and locks. −points (config), no life. Logged. Keyboard: H on the focused slot |
| Timer | Counts up from "Go", as in Juft; scoring uses par time per pair |
| Score | `core/scoring`: per-pair base, time vs par, minus wrong checks and hints, combo for consecutive first-try pairs, × mode and Cyrillic multipliers. Never below 0 |
| Stars | 3 thresholds per level from par time and mistakes |
| Unlock | Per mode: clearing level *n* unlocks *n+1*; any unlocked level is replayable; best score kept |
| Pause | Freezes the timer and hides the bank and slots |
| Keyboard | Tab / arrow keys switch side; typing a letter takes a matching bank tile; Backspace returns the last placed tile; Enter checks |

## Level progression (initial curve, validated by simulation in I8)
60 levels in four chapters of 15 on the shared level map (building names chosen in the mockup task).

| Levels | Pairs | Letters per word | Content |
|---|---|---|---|
| 1–15 | 5 | 2–4 | Top-frequency, high-transparency cognates |
| 16–30 | 6 | 3–5 | Next frequency bands, lower transparency |
| 31–45 | 7 | 3–6 | Russian, Persian, Arabic loans in the mix (if enabled) |
| 46–60 | 8 | 4–8 | Opaque cognates and suffixed forms (evde ↔ uyda) |

- **Pool:** `boardPool` (no false friends), enabled source languages, one source form per item chosen as in Juft
  (Turkish first). Excluded: multi-word or hyphenated forms, words over 8 letters, and pairs spelled **identically**
  in the shown scripts (spelling *bu* twice teaches nothing).
- **Letters** come from `core/text`: Uzbek via `toLetters` (sh, ch, ng, oʻ, gʻ are single tiles, so Latin and
  Cyrillic boards have the same tile count), source languages via a new source-letter splitter (I1).
- **Missed pairs** come back in later levels via `core/scheduler`.
- **Determinism:** seed = `imlo:<mode>:<level>:<settingsHash>`; every attempt gets a fresh bank shuffle.

## Settings that affect Imlo
Source languages and Uzbek script, shared with Juft. With several languages on, each pair shows one source word,
with the same script badge as Juft. Persian and Arabic slot rows are RTL.

## Product-rule exception (decided)
`CLAUDE.md` says no English on game boards. Like Soxta, **Imlo's clue is the English meaning**: there is no other
neutral way to name the word without giving away one of the two spellings. The exemption covers only the clue; the
letters, slots and button are Uzbek. Recorded in `CLAUDE.md`, the PRD and the design brief.

## Dependencies on shared modules
`core/text` (letters, scripts, RTL meta), `core/content` (`boardPool`), `core/random` (shuffle, distractors),
`core/session`, `core/scoring`, `core/difficulty`, `core/scheduler`, `core/learning-log`, `core/sim`; `ui/Tile`,
`UzText`/`SourceText`, `useLongPress`, HUD, Results, LevelMap, GameShell. **New:** a source-language letter splitter
in `core/text` (I1), and per-game difficulty modes in the game contract and shell (I5).

## Learning-log events
`level_start`, `spell_correct {itemId, sourceLang, rtMs, checks, hints}`,
`spell_wrong {itemId, sourceLang, side, given, expected}`, `hint_used {itemId, side, slot}`, `level_complete`,
`level_failed`. `spell_wrong` with `given` and `expected` is the research payoff: it shows *which* letters
Turkish knowledge gets wrong in Uzbek (e.g. writing *isim* for *ism*).

## Decisions (approved by the user, 2026-11-07)
1. **English clue:** allowed, as the exception above.
2. **Persian and Arabic:** separate letter tiles in isolated forms, in the bank and in the RTL slot row, exactly as
   for the other languages. **No joined preview** of the word: showing it would give the spelling away.
3. **Priority:** Imlo is built before Soxta.
4. **Identical spellings** (e.g. *bu* ↔ *bu*) are excluded from the pool.
5. **Slot count** shows the word length (kept as designed); one check covers both sides.

## Approved decisions (screens, I4, approved by the user 2026-11-07)
Reference mockup: `../design/mockups/I4-imlo-screens.html` (screens in `../design/mockups/screens/I4-*.png`).
1. **Screens:** level map, ready card with the mode picker, board, pause, results, fail. Countdown, settings and home are Juft's.
2. **Layout:** phone: source row, check star with the English clue under it, Uzbek row, bank. Desktop: rows left and right of the star, bank across the bottom. Nothing scrolls.
3. **Active row:** 3 px gold outline, corner star, faint glaze fill. Next empty slot: dashed gold edge with a star.
4. **Sockets:** used bank tiles leave dashed sockets; slots never reflow.
5. **Check star "Tekshir"** (Cyrillic "Текшир"): dashed outline until every slot on both sides is full, then solid gold; when right it becomes the signature star with a ✓.
6. **Correct:** both rows glaze gold with a ✓ badge, lock into the star, next pair slides in. **Wrong:** only the wrong row cracks and shakes, a right row glazes; letters stay; one life is lost.
7. **Oson colouring:** source letters turquoise-tinted with a ◆, Uzbek letters cobalt-tinted with a ● and a double edge. New token `--color-cobalt-pale` (#DCE5F7 light, #1F3A78 dark); all pairs pass `contrast.mjs`.
8. **Largest board fits:** 8 + 8 letters + 4 extras (20 tiles). Phone: slots 52/50/47/44 px by word length (2 px gaps at 8), bank tiles 46 × 50 px, 7 per row. Desktop: slots 64/60/56 px, bank 56 × 60 px. Nothing under 44 px.
9. **Hint:** hold an empty slot 450 ms, a gold ring fills, the letter drops in and locks with a padlock and a −5 pop. No English, no life lost. Keyboard H.
10. **Persian and Arabic:** RTL slot row, first letter at the right, isolated-form tiles, no joined preview.
11. **Digraphs** (sh, ch, oʻ, gʻ, ng) are single tiles.
12. **Level map:** four buildings of 15 levels: Madrasa (1–15), Masjid (16–30), Minora (31–45), Registon (46–60). Progress is kept per mode, with three tabs on the map.
13. **In-level progress:** a row of octagons (done gold, current outlined with a dot, to do dashed) plus the mode name. HUD as in Juft.
14. **Reduced motion:** every animation has an instant replacement that keeps its shape cue; pause hides the board instantly in every setting.
15. **Results and fail** reuse Juft's layouts; results name the mode and multiplier, fail says same pairs, fresh shuffle.

## Out of scope (v1)
Audio, free typing on the device keyboard (a hardware keyboard works through the bank), stats screen.

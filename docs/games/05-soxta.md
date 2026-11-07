# Game 5: Soxta (False-Friend Swipe)

> *soxta* (Uzbek) = fake, false (Turkish *sahte*). Working title. **Status: DRAFT, awaiting user approval.**

## Pitch
Two words sit on opposite sides of the screen: an **Uzbek** word on one side, a **Turkish** word on the other.
They look alike, but they are false friends. A single English meaning appears in the middle. **Swipe toward the
word that carries that meaning.** Chain as many correct swipes as you can before you run out of mistakes.

This is Juft's mirror image. Juft rewards trusting the resemblance; Soxta trains you to *distrust* it. It goes
straight at the research question: where does Turkish help with Uzbek, and where does it betray you?

## Core loop (draft)
1. A card shows the two words (Uzbek left or right at random, via injected `Rng`) and one English meaning
   centred between them. The meaning belongs to exactly one of the two words.
2. The player swipes (or taps) left or right. Keyboard: arrow keys.
3. **Correct:** the card glazes gold and the next card slides in. **Wrong:** a crack runs across the tile and
   one life is lost. A short reveal shows the *other* word's true meaning so the mistake teaches something.
4. **Timer:** each card has its own countdown that tightens as the streak grows. A timeout counts as a mistake.
5. **End:** the run is over after **3 mistakes** (config). Score = correct swipes with a streak multiplier.
   Endless; the difficulty ramps by moving to less obvious false-friend pairs.
6. Script toggle: the Uzbek word shows in Latin or Cyrillic (player setting). Turkish is always Turkish script.

## Trains
Unlearning Turkish interference: recognising that a familiar-looking word means something different in Uzbek.
Builds meaning-to-word recall for Uzbek false friends specifically.

## Product-rule conflict (needs your decision)
`CLAUDE.md` says **no English on game boards** (only a points-costing long-press hint). This game's clue *is*
English. Options:
- **A. Exempt this game** because English is the neutral third language that both words contrast with. Simplest,
  and matches your description. *(recommended)*
- **B. Use a picture or emoji as the clue** where one exists. Keeps the rule, but many false friends are abstract.
- **C. Use Russian as the clue.** Keeps "no English" but changes who the game is for.
If A, the rule becomes: "No English on game boards, except the Soxta clue", recorded in `CLAUDE.md` and the PRD.

## Dependencies on shared modules
`core/session` (lives, run end), `core/scoring` (streak multiplier), `core/difficulty` (timer tightening, pair
tiers), `core/random` (side assignment, pair order), `core/text` (scripts), `core/scheduler` (resurface missed
pairs), `core/learning-log`; `ui/Tile`, HUD and results. **New:** `ui/useSwipe` (pointer-gesture hook with tap and
keyboard fallbacks, reduced-motion safe) and a false-friend field on content pairs.

## Content needs
Juft **excludes** false friends from its boards, so this game needs its own set. Pairs need: Uzbek word (both
scripts), Turkish word, the English meaning of each, and a difficulty tier. Illustrative, to be verified by the
content task: Uzbek *toy* (wedding) vs Turkish *toy* (naive, inexperienced); Uzbek *boy* (rich) vs Turkish *boy* (height).

## Open questions and risks
- **Supply:** how many verified Turkish–Uzbek false friends exist at useful frequency? Possibly only 50–150.
  Partial false friends (one shared sense, one not) could pad the set but muddy the "exactly one" rule.
- **Control cards:** mix in true cognates where *both* words fit, answered with a third gesture (swipe up)? Adds
  realism and stops "always distrust" becoming a strategy. Probably a later level.
- **Timer shape:** per-card countdown plus lives (proposed), or one global clock with time bonuses?
- **Reverse mode:** show the two words and ask for the meaning among English choices? Likely a later variant.
- Add **Persian/Arabic/Russian** false-friend pairs later, reusing the same card.

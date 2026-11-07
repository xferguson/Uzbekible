# Game 5: Soxta (False-Friend Swipe)

> *soxta* (Uzbek) = fake, false (Turkish *sahte*). Working title. **Status: approved plan, backlog. On hold until Juft v1 ships (tasks J1–J6 are on hold).**

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

## Product-rule exception (decided)
`CLAUDE.md` says no English on game boards. **Soxta is exempt**: its clue *is* the English meaning, because English
is the neutral third language that both words contrast with. The exemption covers only the clue (and the reveal
after an answer); the two words themselves are never glossed. Recorded in `CLAUDE.md`, the PRD and the design brief.

## Decisions (approved)
- **Timer:** a per-card countdown that tightens with the streak, plus **3 lives**. A timeout costs a life.
- **Content:** reuse the existing false-friend data (`relation: false-friend` sources, the same entries the user
  reviews in C6). No new research task. The one gap is the Turkish word's own English meaning, for the reveal and
  for clues about the Turkish word; see J1.
- **Control cards (later idea, worth trying):** mix in true cognates where *both* words fit, answered with a third
  gesture (swipe up). It stops "always distrust" becoming a winning strategy. Not in v1.

## Dependencies on shared modules
`core/session` (lives, run end), `core/scoring` (streak multiplier), `core/difficulty` (timer tightening, pair
tiers), `core/random` (side assignment, pair order), `core/text` (scripts), `core/scheduler` (resurface missed
pairs), `core/learning-log`; `ui/Tile`, HUD and results. **New:** `ui/useSwipe` (pointer-gesture hook with tap and
keyboard fallbacks, reduced-motion safe) and a false-friend field on content pairs.

## Content needs
Source: items in `content/items/` whose `sources` include `relation: false-friend` (about 70 today, mostly
Turkish). Each yields a card: the Uzbek item (`uz`, `glossEn`) and the Turkish word (`sources[].text`). Juft keeps
excluding these from its boards (`boardPool`), so Soxta has its own pool function. Needed addition: an optional
English gloss on the Turkish source, so the clue can be the Turkish word's meaning too. Without it, cards fall back
to Uzbek-meaning clues only.

## Open questions and risks
- **Supply:** about 70 pairs is enough for a first version but a short run before repeats. Spaced repetition of
  missed pairs (`core/scheduler`) helps. More pairs can come from C3/C4 follow-ups.
- **Partial false friends** (one shared sense, one not) muddy the "exactly one" rule; exclude them from v1.
- **Reverse mode:** show the two words and ask for the meaning among English choices. A later variant.
- Add **Persian/Arabic/Russian** false-friend pairs later, reusing the same card.

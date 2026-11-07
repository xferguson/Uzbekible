# Game 2: Qoʻsh (Compose)

> *qoʻsh-* (Uzbek) = to add or join; *qoʻshimcha* = suffix. Working title. **Status: backlog.**

## Pitch
A word-builder in the spirit of honeycomb/Scrabble letter games, but with **morphemes** instead of letters. You
get a pool of roots and a pool of suffixes. Snap them together into real Uzbek words (and later short phrases),
then say what you think your creation means. Real word and right meaning: points. A made-up form that Uzbek
doesn't have: no points.

## Core loop (draft)
1. The board shows a honeycomb of hex tiles: a few **roots** (kitob, kel-, uy, yoz-, …) surrounded by
   **suffixes** (-lar, -im, -da, -ga, -di, -yap, -man, …).
2. Drag a path (root → suffix → suffix) to build a form, e.g. kitob + lar + im + da → *kitoblarimda*.
3. Submit, then **state the meaning**. This needs a format without English on the board. Options:
   - pick the matching **Turkish** form from 3–4 choices (kitaplarımda), which fits the research question; or
   - pick a picture or emoji (for concrete nouns).
4. Score: base points per morpheme, a bonus for longer valid stacks, a bonus for rare valid forms, and nothing for
   non-words or a wrong meaning.
5. A round lasts N seconds or N submissions; levels add new roots and suffix families.

## Trains
Productive morphology: possessives, cases, plurals, tense/aspect/person. It also shows where Uzbek and Turkish
suffixes match (-lar/-ler, -da/-de, -dan/-den, -di/-dı) and where they don't (-yap- vs -iyor-, no vowel harmony).

## Dependencies on shared modules
`core/morphology` (attachment rules, allomorphs -ga/-ka/-qa, validation), `core/text` (letters, normalization),
`core/session`, `core/scoring`, `core/difficulty`, `ui/Tile` (hex variant), `ui/usePathSelect`, `core/learning-log`.

## Open questions and risks
- **Validity oracle:** a rule engine (generate and validate) or a precomputed whitelist of attested forms
  (corpus)? Proposal: generate with rules, and accept only forms that are rule-valid **and** in an attested-form
  list, so we never reward grammatical-but-odd forms.
- Words only, or clauses too? Proposal: words in v1, two-word phrases (noun + verb) later.
- Meaning check without English: Turkish multiple choice (recommended) vs. pictures.
- Placement: after Juft's suffixed-form levels, so players have seen the suffixes.

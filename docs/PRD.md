# Uzbekible: Product Requirements Document

> **Uzbekible** (with an *i*) plays on *impeccable* and on *Uzbek-able*: you can make Uzbek happen.

| | |
|---|---|
| Status | v1.0.0: Juft (Game 1) released |
| Owner | Alexander Ferguson |
| Last updated | 2026-11-07 |

## 1. Vision
Uzbekible is a set of phone-first, arcade-style games that use Uzbek as their **medium**. It should feel like
the level-based puzzle and reflex games people already play on their phones, not like a language course. There
are no lessons and no explanations, just play. You learn because playing well depends on reading, hearing and
saying Uzbek quickly.

## 2. The research question
> **Given intermediate (B1) Turkish, what is the fastest path to Uzbek?**

Every game is an experiment in moving Turkish knowledge over to Uzbek. That means:
- Content is ordered by **Uzbek frequency** and filtered or tagged by how it relates to languages the player
  already knows: Turkic cognates, shared Arabic and Persian loans, Russian loans.
- Content records the **sound correspondences** between Turkish and Uzbek (g→k, a→o, ö→oʻ, -mak→-moq, …),
  so the player picks up the patterns without being taught them.
- The app keeps a **local learning log** of every attempt (item, correct or not, response time, hint used),
  exportable to CSV/JSON. This is how we measure what transfers quickly and what doesn't.

## 3. Learner profile (primary persona)
- An English speaker with **B1 Turkish**: knows vowel harmony and the case and tense suffixes, and holds simple conversations.
- Little or no Uzbek.
- Can read Cyrillic slowly (via some Russian exposure) or not at all, so Cyrillic is treated as a "hard mode".
- Plays in short sessions on a phone and enjoys speed, scores and level progression.

Secondary personas, later: Russian speakers learning Uzbek, and heritage learners.

## 4. Product principles
1. **Game first.** If a feature feels like homework, redesign it as a mechanic.
2. **Leverage what you know.** Pair Uzbek with Turkish, Russian, Persian or Arabic. **No English on game boards.**
   English appears only as a long-press hint that costs points. **Exceptions: Soxta (Game 5) and Imlo (Game 6)**, whose clues are an English meaning.
3. **Frequency first.** Introduce the most useful words first.
4. **The motif is the mechanic.** Uzbek tilework (cobalt, turquoise, white, gold) isn't decoration: matched tiles
   form girih stars, and progress builds a mosaic facade. See `design/brief.md`.
5. **Zero friction.** No accounts, no login. It works offline as an installable PWA, and all state stays on the device.
6. **Native scripts.** Uzbek appears in Latin or Cyrillic (a toggle). Every other language appears in its own
   script: Turkish Latin, Russian Cyrillic, Persian and Arabic in Arabic script.

## 5. Game catalog
| # | Game | Core loop | Trains | Status |
|---|---|---|---|---|
| 1 | [**Juft** (Pair Match)](games/01-juft.md) | Timed matching between two columns, source language ↔ Uzbek | Recognition, cognate transfer, sound correspondences, (later) suffixes | **Build first** |
| 2 | [**Qoʻsh** (Compose)](games/02-compose.md) | Combine roots and suffixes into real words and phrases, then state the meaning | Morphology, productive word building | Backlog |
| 3 | [**Wordfall** (Say it!)](games/03-wordfall.md) | Words fall across a tilework sky; say them aloud to zap them | Reading speed, pronunciation | Backlog (speech-to-text risk) |
| 4 | [**Eshit** (Listen & Search)](games/04-listen-search.md) | Hear a word, then find it in a letter grid | Listening, sound-to-spelling | Backlog (needs audio) |
| 5 | [**Soxta** (False-Friend Swipe)](games/05-soxta.md) | Swipe toward the word (Uzbek or Turkish) that matches an English meaning | Unlearning false friends | Next (approved plan; content already exists) |
| 6 | [**Imlo** (Cognate Spelling)](games/06-imlo.md) | Spell both sides of one cognate pair from a shared, shuffled letter bank, given an English meaning | Spelling production, exact sound correspondences | **Playable** (Oson / Oʻrta / Qiyin; reuses Juft's content) |

More game ideas will be added here as they come up.

### Prioritization
1. **Game 1, Juft.** It goes straight at the research question (Turkish→Uzbek transfer), needs no audio or
   speech recognition, and builds the shared engine everything else uses.
2. **Game 4, Eshit** (proposed). The mechanic is simple once the audio plan (spike S1) is in place, and it adds listening.
3. **Game 2, Qoʻsh** (proposed). It needs the morphology engine and the suffix content from Game 1's later levels.
4. **Game 3, Wordfall** (proposed). It carries the biggest technical risk: speech recognition for Uzbek (spike S2).

The order of Games 2–5 is to be confirmed after Game 1 ships. Imlo (Game 6) comes next, then Soxta: both reuse existing content, and Imlo also reuses Juft's pool and settings.

## 6. Cross-cutting requirements
| Area | Requirement |
|---|---|
| Platform | Installable PWA that works offline after first load, phone-first, also playable on desktop |
| Persistence | localStorage only, versioned with migrations. No accounts, no server |
| Scripts | Uzbek Latin ↔ Cyrillic toggle. Source languages in their native scripts. RTL support |
| Source languages | Turkish, Russian, Persian, Arabic toggles (each can be on or off) |
| English | Never on boards. Long-press hint only, and it costs points. Exceptions: the Soxta and Imlo clues |
| Audio | None in Game 1 v1. Required for Games 3 and 4 (see the audio plan in the technical design) |
| Learning log | Every game logs attempts locally. CSV/JSON export in Settings |
| Accessibility | WCAG 2.2 AA contrast, keyboard play, reduced-motion alternatives, state never shown by colour alone |
| Visual identity | Uzbek tilework design system shared by all games, including the PWA icon |

## 7. Success metrics
**Fun:**
- Players come back on day 2 and day 7 (self-tracked).
- Average levels per session ≥ 5.
- Replays of earlier levels to beat a score (a sign the score is motivating).

**Learning (from the exported log):**
- Time to first correct match per item.
- Accuracy on the second exposure.
- Response time falling over exposures.
- All of the above **split by relation type** (Turkic cognate vs. shared loan vs. Russian loan) and by sound
  correspondence. This is the answer to the research question.

**Quality:** Lighthouse PWA installable, a11y score ≥ 95, no failed CI on `main`.

## 8. Non-goals (for now)
- Accounts, cloud sync, social or leaderboards
- Explicit grammar lessons or explanations
- Monetization
- Languages other than Uzbek as the target

## 9. Later / parking lot
- Juft hard mode: one mixed mosaic grid instead of two columns
- Audio for Juft (speak the Uzbek word on a correct match) once the audio plan lands
- Stats screen (mastery, learning curves) on top of the learning log
- Visual-regression screenshot tests; mutation testing (Stryker) for `src/core`
- Cyrillic-reading-focused game; Russian-speaker persona

## 10. Process
- The task queue and gates are in [`tasks/README.md`](tasks/README.md). Work runs in separate sessions, one task per PR.
- **Gates:** D1 (general design mockups) → user approval → D2 (Game 1 mockups) → user approval → Game 1 UI build.
  Engine and content tasks can run in parallel with the design gates.

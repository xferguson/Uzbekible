---
name: cognate-research
description: Use when researching Uzbek frequency, Turkish–Uzbek cognates, sound shifts, or Russian/Persian/Arabic loans (tasks C1–C4).
---

# Cognate & frequency research method

The product exists to answer: *with B1 Turkish, what is the fastest path to Uzbek?* Content quality is the
experiment's validity — be rigorous and cite everything.

## 1. Frequency (task C1)
- Prefer corpus-derived lemma lists. Candidates (verify availability + license, record in `content/sources/SOURCES.md`):
  Leipzig Corpora Collection (Uzbek news/web/wiki), OpenSubtitles-derived frequency lists,
  Uzbek Wikipedia dumps (tokenize + lemmatize), published Uzbek frequency dictionaries.
- Lemmatize: frequency of *lemmas*, not surface forms (kitoblarimizda → kitob). Note the method used.
- Record for each lemma: rank, raw count, corpus, POS if available.
- Normalize spelling with `core/text` (apostrophes!) before merging lists.

## 2. Classify each lemma's relation to a source language (tasks C2, C3)
| relation | meaning | example |
|---|---|---|
| `turkic-cognate` | inherited from Common Turkic in both | koʻz ↔ göz, kelmoq ↔ gelmek |
| `shared-arabic` | both borrowed from Arabic | kitob ↔ kitap, hayot ↔ hayat |
| `shared-persian` | both borrowed from Persian | doʻst ↔ dost, shahar ↔ şehir |
| `russian-loan` | Uzbek borrowed from Russian | mashina ↔ машина |
| `persian-loan` / `arabic-loan` | pair against the *origin* language word itself | doʻst ↔ دوست |
| `false-friend` | similar form, different meaning | qoʻl (hand/arm) vs Turkish kol (arm) |

Sources to consult: Wiktionary etymology sections (Uzbek and Turkish entries), Clauson's *Etymological
Dictionary of Pre-Thirteenth-Century Turkish*, Starostin's Turkic etymology database, Nişanyan Sözlük
(Turkish etymology), Uzbek explanatory dictionary (Oʻzbek tilining izohli lugʻati).

## 3. Confidence
- `high`: two independent sources agree on relation and meaning.
- `medium`: one reliable source, or meaning overlap is partial.
- `low`: inferred from form similarity only → must appear in the review sheet.

## 4. Sound correspondences (feeds `core/similarity`)
Tag each Turkic pair with the shifts it shows, using the rule IDs in `src/core/similarity/rules.ts`.
Starter set (verify and extend; add rule + test when a new one appears ≥3 times):
- `g>k` word-initial (göz→koʻz, gün→kun, gelmek→kelmoq)
- `k>q` before back vowels (kız→qiz, kara→qora)
- `a>o` (baş→bosh, al-→ol-, kara→qora)
- `ö>oʻ`, `ü>u` (göz→koʻz, üç→uch); Uzbek has lost vowel harmony
- `v>b` initial (ver-→ber-)
- `ğ>gʻ`/`g` (dağ→togʻ)
- infinitive `-mak/-mek > -moq`
- `ev>uy` style irregulars → tag `irregular` (these are the "hard pairs")

## 5. Output
Write to `content/items/*.yaml` per the `add-content-items` skill. Summarize in the PR: counts per relation,
per confidence, coverage of the top 100/200/500/1000, and a list of `low` items for the user to review.

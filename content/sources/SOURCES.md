# Content sources

Every corpus, list, tool and dictionary used to build Uzbekible content, with URL, license, retrieval date and
how it was used. Raw inputs are **not** committed (size and mixed licenses); each entry pins the exact commit
or version so the build can be re-run (see [`freq/README.md`](freq/README.md)).

## Corpora and lists (task C1)

| key | source | URL | license | retrieved | pinned version | used for |
|---|---|---|---|---|---|---|
| `cv` | Mozilla Common Voice: Uzbek sentence-collector sentences (Wikipedia extracts and user submissions) | https://github.com/common-voice/common-voice/blob/main/server/data/uz/sentence-collector.txt | CC0 1.0 (sentence data; the repo's code is MPL-2.0) | 2026-11-07 | commit `3cf5dd0f81555dced52fa5a1b85f3956cdfe0c76`, file sha256 `ac040f9b89d619a2…` | token counts: 148,391 sentences, 976,242 tokens |
| `uzcs` | Elmurod Kuriyozov, *Uzbek Corpus Sample*: 100k sentences from articles, books and translated sentences | https://github.com/elmurod1202/Uzbek-Corpus-Sample | CC BY 4.0 | 2026-11-07 | commit `6286141e04196c627d00df156a4004d1f0dc8b46`, file sha256 `13f05d957f229371…` | token counts: 100,000 sentences, 537,000 tokens |
| `kaharjan` | Kaharjan, *uzb-frequent-words*: 419,999 Uzbek Cyrillic word forms from books and websites, ranked by frequency (no counts; proper nouns removed by the author) | https://github.com/kaharjan/uzb-frequent-words | GPL-3.0 | 2026-11-07 | commit `3a8f3daa3c8d8ce5562e664b50c727bdebfb17a0`, file sha256 `7dec56980e33774c…` | rank signal (top 60,000 forms) and the Cyrillic attestation check |

## Tools and gold data (task C1)

| source | URL | license | retrieved | pinned version | used for |
|---|---|---|---|---|---|
| Apertium Uzbek morphological analyser (`apertium-uzb`), compiled with HFST 3.16.0 | https://github.com/apertium/apertium-uzb | GPL-3.0 | 2026-11-07 | commit `1bdee4a38c357226176d516ae533c43f8ecb045b` | lemma and POS candidates for every surface form |
| UD Uzbek-UT treebank (Akhundjanova & Talamo 2025), 500 sentences | https://github.com/UniversalDependencies/UD_Uzbek-UT | CC BY-SA 4.0 | 2026-11-07 | commit `65cbf83058a121826ca30cd3bb33e6c48bec81a9` (UD v2.15+) | gold lemmas for evaluating the lemmatiser; gold POS labels |
| UD Uzbek-UzUDT treebank (Matlatipov & Kuriyozov), 684 sentences | https://github.com/UniversalDependencies/UD_Uzbek-UzUDT | CC BY-SA 4.0 | 2026-11-07 | commit `186b97a5fbc6d06ed22f8d941bd45c30c5528bc9` (UD v2.16+) | as above |

**Not reachable from the build environment** (network policy): Leipzig Corpora Collection
(`downloads.wortschatz-leipzig.de`, `wortschatz.uni-leipzig.de`), Wikimedia dumps (`dumps.wikimedia.org`),
OPUS/OpenSubtitles (`object.pouta.csc.fi`) and Hugging Face (`huggingface.co`). Allowing these hosts would let a
later revision add a large news/web corpus with real counts. OpenSubtitles-derived lists (hermitdave/FrequencyWords)
have no Uzbek.

**License note for review.** The output CSV contains derived statistics (lemmas, ranks, counts), not source
text. Two inputs are GPL-3.0 (`kaharjan` for one of three rank signals, Apertium as a tool) and the UD treebanks
are CC BY-SA 4.0 (they supply the POS label for 547 of the 1000 rows). Word-frequency facts are generally not
protected expression, but attribution is kept here. Flagged for the user in the C1 PR.

## Turkish partners (task C2)

| key | source | URL | license | retrieved | pinned version | used for |
|---|---|---|---|---|---|---|
| `apertium-tur-uzb` | Apertium Turkish–Uzbek bilingual dictionary (`apertium-tur-uzb.tur-uzb.dix`, 13,100 entries) | https://github.com/apertium/apertium-tur-uzb | GPL-3.0 | 2026-11-07 | commit `a96a28b669730a36f74adfd424fc6d24203dcdc4`, file sha256 `92d71a82c20a65ee…` | meaning evidence: does the dictionary pair the Uzbek lemma with the Turkish word? |
| `wiktionary` (via EtymDB) | EtymDB 2.1 (Fourrier & Sagot, LREC 2020): etymology links extracted from English Wiktionary | https://github.com/clefourrier/EtymDB | CC BY-SA 4.0 | 2026-11-07 | commit `878e5a55627048c6ed414a7b23739fe2385bd723` | origin evidence: Uzbek and Turkish ancestor chains (Proto-Turkic, Arabic, Persian, European) |

Curator judgement (`curated.tsv`) picks each partner and its relation; the two sources above only set the
confidence (see [`cognates/README.md`](cognates/README.md)). Not reachable from the build environment: Wiktionary
itself, kaikki.org, Nişanyan Sözlük and the StarLing (Starostin) databases. Allowing them would let a later
revision raise `low` items. Derived facts only (pairings, origin classes) are stored, not dictionary text.

---

## Method: `uz-freq-top1000.csv` (task C1)

Code: [`freq/lib.mjs`](freq/lib.mjs) (unit-tested in [`freq/lib.test.mjs`](freq/lib.test.mjs)) and
[`freq/build.mjs`](freq/build.mjs). The generated diagnostics are in [`freq/report.md`](freq/report.md).

**Columns.** `rank, lemma, cyrl, pos, count, source`.
- `lemma`: canonical Uzbek Latin, NFC, `oʻ`/`gʻ` with U+02BB and the tutuq with U+02BC. Verbs are in the
  dictionary `-moq` form (`kel-` → `kelmoq`); every other part of speech uses the bare stem.
- `cyrl`: generated from `lemma` by the transliterator in `freq/lib.mjs` and checked against the kaharjan
  Cyrillic list. 978/1000 match an attested form verbatim. The 22 that do not (mostly infinitives the list
  lacks, e.g. `бошланмоқ`, plus `у`, `биз`, `да`, which the list omits) were checked by hand.
- `pos`: lowercase UD-style (`noun verb adj adv pron det adp conj num part intj aux`). Precedence: the
  reviewed label in `freq/lemma-fixes.csv`, then the majority UD gold POS when the lemma occurs at least 3× in UD,
  then the analyser's majority choice.
- `count`: raw lemma tokens summed over the two counted corpora (`cv` + `uzcs`, 1.51M tokens). The kaharjan list
  has ranks only, so it contributes to the ranking but not to `count`.
- `source`: the sources the lemma is attested in (`cv;uzcs;kaharjan`). 986 rows are in all three, 14 in two.

**1. Normalisation and tokenisation.** Text is NFC-normalised. Every apostrophe variant (`' ` ‘ ’ ʻ ʼ ´ ʹ ′`)
after `o`/`g` becomes U+02BB, and any other in-word apostrophe becomes U+02BC (tutuq). Tokens are maximal
letter/apostrophe runs. Leading apostrophes are opening quotes and are stripped. A trailing one is kept only after
`o`/`g` (`togʻ`). Tokens are lowercased. Only pure Uzbek-Latin tokens are kept, which drops digits, Cyrillic and
foreign letters. Hyphens split tokens (`ota-ona` → `ota`, `ona`). Kaharjan's Cyrillic forms are converted to Latin
(`е` → `ye` word-initially and after vowels/`ъ`/`ь`; `ц` → `ts` after vowels, else `s`).

**2. Proper nouns.** In `cv`/`uzcs`, a form is a proper noun if it occurs ≥3 times outside sentence-initial
position and is capitalised in more than half of those occurrences (filtered 1,606 and 471 forms, e.g. Tom, Toshkent).
Analyser readings tagged `np` (and `abbr`) are also discarded. Kaharjan's list already excludes proper nouns.

**3. Lemmatisation.** Every distinct form (157,422) is run through the Apertium Uzbek analyser. Clitic copula
tails (`+e<cop>`) are dropped. When a form has several readings, a deterministic cascade picks one:
1. **Reviewed surface-form overrides** (`freq/overrides.csv`, 14 forms, e.g. `deb` → `de-`, `bor` → adjective).
2. **Whole-word closed-class reading wins**: aux, num, pron, adp, conj, det, part (`va`, `uchun`, `emas`).
   Copula readings map to `edi` / `ekan` / `emas` / `emish` (UD Uzbek keeps these as lemmas).
3. **Corpus prior.** Each form's frequency mass is split evenly over the distinct lemmas its readings allow, and
   the sums form the prior. A whole-word reading (noun/adj/adv) stands unless a non-imperative segmentation
   has a prior ≥ 4× larger. This turns `oldi` into `olmoq` and `uning`/`meni` into `u`/`men`, and keeps `dengiz`
   and `juda`. Margin 4 was tuned on UD gold (2 → 91.4%, 4 → 91.6%, 8 → 91.5%, 16 → 91.1% before the fixes below).
4. Segmentations into a 1–2 letter non-verb, non-pronoun stem are dropped when a longer reading exists
   (`yoshga` ≠ `yo`+…, but `uyda` → `uy`).
5. **Lemma fixes** (`freq/lemma-fixes.csv`, 65 entries, each with a reason). There are three kinds. *block*
   removes spurious analyser readings (`yo-`, `qa-`, `bula-`, misspellings, hyphen fragments). *merge* joins
   lemmas the analyser splits, for example vowel-drop possessives (`oʻgʻli` → `oʻgʻil`), derived stems
   (`erishmoq`, `deyishmoq` → `demoq`) and postpositional cases of nouns (`ichida` → `ich`). *pos* corrects labels.

Result on the UD Uzbek gold treebanks (10,590 tokens): the analyser covers 92.4%, and lemma agreement on the
covered tokens is **92.6%**. Most remaining disagreements are UD conventions (UD lemmatises `ular` and `shunday`
to `u` and `shu`; this list keeps `ular` and `shunday` as dictionary headwords, and `deb` as the verb `de-`).
Forms with no analysis (mostly misspellings and foreign words) are excluded and listed in `freq/report.md`.

**4. Merging the three sources.** For each source, lemma frequencies are put on a per-million scale. For `cv`
and `uzcs` that is the lemma count ÷ corpus tokens × 10⁶. For `kaharjan` (ranks only) each form gets a Zipf
estimate `10⁶ / (rank · H₄₁₉₉₉₉)` (f ∝ 1/rank, normalised to sum to 10⁶ over the full list), summed over forms
of the same lemma. The score is the arithmetic mean of the three per-million values, with absent counted as 0.
Lemmas must be attested in ≥2 sources (this drops single-source noise such as web boilerplate). Ties break
alphabetically, so the build is deterministic. Of 10,207 lemmas in ≥2 sources, the top 1000 are written.

**Known limitations.** Homographs share a row (`yuz` "face"/"hundred", `och` "hungry"/"open!", `tur`
"type"/"stand"). The two counted corpora lean towards conversational and Wikipedia/literary text. Kaharjan's
list is older (2016) web/book text and slightly literary (e.g. `ul`, `erur`). Lemma choice is per form, not in
context. The C6 review sheet is where these should get a human check.

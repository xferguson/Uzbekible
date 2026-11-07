# C3 Russian, Persian and Arabic partners

Adds `ru`, `fa` and `ar` sources to [`../../items/freq-*.yaml`](../../items/): for a top-1000 lemma that Uzbek took
from one of these languages, the **origin word itself** in its native script (Cyrillic, Perso-Arabic, Arabic).
Relations: `russian-loan`, `persian-loan`, `arabic-loan`. Sources and licenses: [`../SOURCES.md`](../SOURCES.md).

| file | what |
|---|---|
| `curated.tsv` | **the reviewed data**: `rank, lemma, ru, fa, ar`; several partners in a cell joined by `\|`. Edit this, then rebuild |
| `lib.mjs` / `lib.test.mjs` | pure helpers (script checks, folding, confidence) and Vitest tests, including a data check over `content/items` |
| `build.mjs` | the CLI: joins `curated.tsv` with EtymDB evidence, writes the sources, `evidence.tsv` and `report.md` |
| `evidence.tsv` | generated: per partner, whether each Wiktionary entry supports it, exact-spelling match, confidence |
| `report.md` | generated: counts per language and confidence, coverage, the low-confidence list, items for C6 review |

## Curation rules
- The partner is the word Uzbek borrowed from (Russian), or the Persian/Arabic **origin** word, spelled unvocalised
  and in the standard form (Arabic ك ي, Persian ک ی). Russian ё is kept (самолёт).
- Words that reached Uzbek through Persian but are Arabic by origin are recorded with the language Uzbek took them
  from when Wiktionary says so (`doʻkon` ← Persian دکان). These differ from C2's `shared-arabic` class and are listed
  in `report.md` for review.
- Turkic words, native compounds and derived forms of loans (`kasalxona`, `xalqaro`) get no partner. A derived
  Uzbek form of a loan is paired with the base origin word (`hisoblamoq` ↔ حساب).
- No `correspondence` tags: they are computed for Latin-script pairs (C2) and would need transliteration here.

## Confidence (mechanical, as in C2)
Two independent Wiktionary (EtymDB) entries are checked: the **Uzbek** entry's ancestor chain and the **Turkish
partner's** (from C2). `high` = both reach the claimed language, `medium` = one, `low` = neither (curator judgement,
`ref: curator:C3`, listed in `report.md` for C6). Russian loans can reach at most `medium` (no Turkish side).
EtymDB covers only part of the lemmas, so `low` is large; it means *unchecked*, not *doubtful*.

## Reproduce
```bash
W=$(mktemp -d)
git clone --depth 1 https://github.com/clefourrier/EtymDB "$W/EtymDB"   # commit pinned in SOURCES.md
node content/sources/loans/build.mjs --etymdb "$W/EtymDB/data/split_etymdb"
```
Deterministic. Run after the Turkish build (`../cognates/build.mjs`), which keeps these sources.

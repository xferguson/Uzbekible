# C2 Turkish-partner build

Builds the Turkish sources in [`../../items/freq-*.yaml`](../../items/) (one file per 100 ranks of
[`../uz-freq-top1000.csv`](../uz-freq-top1000.csv)) and the diagnostics in [`report.md`](report.md). Sources and
licenses are listed in [`../SOURCES.md`](../SOURCES.md).

| file | what |
|---|---|
| `curated.tsv` | **the reviewed data**: one row per lemma with an English gloss and its Turkish partner(s) with a relation code. Edit this, then rebuild |
| `lib.mjs` | pure helpers: Turkish/Uzbek letter tokens, sound-shift tagging, etymology classes, confidence rule, Apertium parsing, ids, a local item validator |
| `lib.test.mjs` | unit tests plus a data check over `content/items/freq-*.yaml` (Vitest, `npm test`) |
| `build.mjs` | the CLI: joins `curated.tsv` with the frequency list and the evidence, writes the YAML, `evidence.tsv` and `report.md` |
| `evidence.tsv` | generated: per pair, whether the dictionary pairs them, whether an etymology supports the relation, the confidence and the tags |
| `report.md` | generated: coverage, relation × confidence, tag counts, the low-confidence list and the false friends |

`core/text` (K1), `core/content` (C5) and `core/similarity` (K8) were not on `main` when this was written, so the
helpers are local. C5's validator should replace `validateItems`, and K8 can adopt the tag IDs below as `rules.ts`.

## `curated.tsv`
Columns: `rank, lemma, glossEn, tr`. `tr` is `text:code`, with several sources joined by `|`, or empty when Turkish
has no related word in common use. Codes: `tc` turkic-cognate, `sa` shared-arabic, `sp` shared-persian,
`ol` other-loan (an internationalism both took from European languages: Uzbek via Russian, Turkish via French or
Italian), `ff` false-friend (a look-alike or a cognate whose meaning differs).

Curation rules:
- The partner is a standard Turkish word that is related to the Uzbek one **and** shares its main meaning. A related
  word whose main meaning differs is a false friend (`qoʻl` hand vs `kol` arm, `pul` money vs `pul` stamp,
  `yomon` bad vs `yaman` formidable, `savdo` trade vs `sevda` passion).
- Unrelated translation equivalents are not recorded (`juda` ↔ `çok`): C2 maps relatedness, not translation.
- Archaic or dialect-only Turkish cognates are left out (`yaxshi` ↔ `yahşi`, `bola` ↔ `bala`).

## Confidence (mechanical)
Two independent sources are checked for every pair:
1. **Meaning**: the Apertium Turkish–Uzbek bilingual dictionary lists the Turkish word as a translation of the
   Uzbek lemma (verbs matched by stem, Turkish infinitive by vowel harmony; circumflexes folded).
2. **Origin**: an EtymDB (Wiktionary etymology) ancestor chain of the Uzbek lemma or of the Turkish word supports
   the relation. Turkic = the chain reaches Proto-/Old Turkic (`trk-pro`, `otk`, …) before any non-Turkic language.
   Arabic/Persian = the chain passes through Arabic / Persian (incl. Middle and Old Persian). Other-loan = the first
   non-Turkic language is European or another non-Arabic, non-Persian one.

`high` = both, `medium` = one, `low` = neither (curator judgement only, listed in `report.md` for C6). A false friend
is `medium` when the dictionary gives the Uzbek word a *different* Turkish translation and an etymology exists for
either word, otherwise `low`. `ref` lists the supporting keys (`apertium-tur-uzb:<tr>`, `wiktionary:<word>`), or
`curator:C2` when there are none.

## Correspondence tags (Turkish → Uzbek)
Computed, not hand-typed: the two words are aligned letter by letter (Uzbek digraphs `sh ch ng oʻ gʻ` are single
letters; Turkish `ş ç c` count as Uzbek `sh ch j`, so spelling differences are not shifts) and each edit is tagged:

| tag | where | example |
|---|---|---|
| `a>o` `o>oʻ` `ö>oʻ` `ö>u` `ü>u` `ı>i` `e>a` | anywhere | baş→bosh, yol→yoʻl, göz→koʻz, üç→uch, kız→qiz, devlet→davlat |
| `k>q` `ğ>gʻ` `ğ>g` `h>x` `n>ng` | anywhere | kara→qora, dağ→togʻ, haber→xabar, deniz→dengiz |
| `p>b` `t>d` `ç>j` | anywhere (Turkish final devoicing) | kitap→kitob, ümit→umid |
| `g>k` `d>t` `v>b` `b>m` | word-initial | gel-→kel-, dil→til, ver-→ber-, ben→men |
| `∅>b` `∅>y` `v>∅` | word-initial insertion/loss | ol-→boʻl-, ağla-→yigʻla-, vur-→ur- |
| `mak>moq` | infinitive | gelmek→kelmoq |
| `epenthesis` | Turkish vowel breaking a final cluster | akıl→aql, isim→ism |
| `tutuq` | Uzbek ʼ (Arabic ʿayn/hamza) | mana→maʼno |
| `irregular` | two or more edits no rule explains | ev→uy, için→uchun |

False friends get no tags. Tag counts are in `report.md`.

## Reproduce
```bash
W=$(mktemp -d)
git clone --depth 1 https://github.com/apertium/apertium-tur-uzb "$W/apertium-tur-uzb"
git clone --depth 1 https://github.com/clefourrier/EtymDB "$W/EtymDB"
# (check out the commits pinned in SOURCES.md for a byte-identical rebuild)
node content/sources/cognates/build.mjs \
  --apertium "$W/apertium-tur-uzb/apertium-tur-uzb.tur-uzb.dix" \
  --etymdb "$W/EtymDB/data/split_etymdb"
```
The build is deterministic and keeps non-Turkish sources already in the item files (task C3).

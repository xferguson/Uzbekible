# C1 frequency-list build

Builds [`../uz-freq-top1000.csv`](../uz-freq-top1000.csv) and [`report.md`](report.md). Sources, licenses and
the method are documented in [`../SOURCES.md`](../SOURCES.md).

| file | what |
|---|---|
| `lib.mjs` | pure helpers: apostrophe folding, tokeniser, Uzbek Latin↔Cyrillic, analysis parsing, lemma choice, priors, Zipf, merging, CSV |
| `lib.test.mjs` | unit tests (Vitest, `npm test`) |
| `build.mjs` | the pipeline CLI |
| `overrides.csv` | reviewed surface-form → lemma decisions |
| `lemma-fixes.csv` | reviewed lemma-level `block` / `merge` / `pos` fixes |
| `report.md` | generated diagnostics: UD agreement, unattested Cyrillic, top forms per lemma, excluded forms |

These helpers are local because `src/core/text` (K1) was not on `main` yet. When the content pipeline (C5) lands,
it should swap in the `core/text` normaliser and transliterator and keep these tests as regression cases.

## Reproduce

Needs Node ≥ 22, git, and HFST (`apt-get install hfst`). Inputs are pinned in `SOURCES.md`.

```bash
W=$(mktemp -d)
git clone --depth 1 https://github.com/kaharjan/uzb-frequent-words "$W/kaharjan"
git clone --depth 1 https://github.com/elmurod1202/Uzbek-Corpus-Sample "$W/uzcs"
git clone --depth 1 --filter=blob:none --sparse https://github.com/common-voice/common-voice "$W/cv" \
  && git -C "$W/cv" sparse-checkout set server/data/uz
git clone --depth 1 https://github.com/apertium/apertium-uzb "$W/apertium-uzb"
git clone --depth 1 https://github.com/UniversalDependencies/UD_Uzbek-UT "$W/ud-ut"
git clone --depth 1 https://github.com/UniversalDependencies/UD_Uzbek-UzUDT "$W/ud-uzudt"
# (check out the commits pinned in SOURCES.md for a byte-identical rebuild)

# Compile the analyser with the stock HFST tools (the same steps as apertium-uzb's Makefile, LR direction).
A="$W/apertium-uzb"; cd "$W"
grep -v 'Dir/RL' "$A/apertium-uzb.uzb.lexc" > LR.lexc
hfst-lexc LR.lexc -o LR.lexc.hfst
hfst-twolc "$A/apertium-uzb.uzb.twol" -o twol.hfst
hfst-twolc "$A/apertium-uzb.uzb.twoc" -o twoc.hfst
hfst-compose-intersect -1 LR.lexc.hfst -2 twol.hfst | hfst-compose-intersect -1 - -2 twoc.hfst | hfst-minimise > LR.hfst
hfst-invert LR.hfst | hfst-fst2fst -O -o uzb.automorf.hfstol
cd -

node content/sources/freq/build.mjs \
  --cv "$W/cv/server/data/uz/sentence-collector.txt" \
  --uzcs "$W/uzcs/uzbek_corpus.txt" \
  --kaharjan "$W/kaharjan/frequent_words_list.txt" \
  --fst "$W/uzb.automorf.hfstol" \
  --ud "$W/ud-ut/uz_ut-ud-test.conllu,$W/ud-uzudt/uz_uzudt-ud-train.conllu,$W/ud-uzudt/uz_uzudt-ud-test.conllu"
```

Optional: `--top N` (default 1000), `--kaharjan-limit N` (default 60000), `--debug out.tsv` (rows with their
top surface forms, used for manual review).

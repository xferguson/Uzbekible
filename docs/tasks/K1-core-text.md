# K1: core/text: normalization, letters, transliteration

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
| Skills | `tdd-task`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/K1-core-text` |

## Goal
Single home for all text logic used by every game and the content pipeline.

## Acceptance criteria
- [ ] `normalize` (NFC), `foldApostrophes` (', ‘, ’, `, ʻ, ʼ), `canonicalizeUz` (oʻ/gʻ → U+02BB, tutuq → U+02BC)
- [ ] `toLowerTr`/`toUpperTr` (I/ı, İ/i)
- [ ] `toLetters(word, 'uz-Latn'|'uz-Cyrl')` treating sh, ch, ng, oʻ, gʻ as single letters
- [ ] `latnToCyrl`, `cyrlToLatn` incl. e/э initial, ye/е, yo/ё, yu/ю, ya/я, ts/ц, ʼ/ъ
- [ ] `scriptMeta(lang)` → {dir, bcp47, fontStack token}

## Test-first plan
- Red first for each function; table tests with the cases listed in the `uzbek-text-rules` skill
- Property: `normalize` idempotent; `cyrlToLatn(latnToCyrl(x)) === x` over generated native-Uzbek words; `toLetters(w).join('') === w`

## Files likely touched
- `src/core/text/**`

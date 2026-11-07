# K1: core/text: normalization, letters, transliteration

| | |
|---|---|
| Status | todo |
| Lane | D Core |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task K1 (core/text: normalization, letters, transliteration). Read CLAUDE.md and docs/tasks/K1-core-text.md first, and follow the skills it lists (tdd-task, uzbek-text-rules, pr-flow). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

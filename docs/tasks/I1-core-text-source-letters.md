# I1: core/text: source-language letter splitter

| | |
|---|---|
| Status | on hold: awaiting approval of the Imlo plan (`docs/games/06-imlo.md`) |
| Lane | I Imlo |
| Depends on | [K1](K1-core-text.md) |
| Read first | `docs/games/06-imlo.md` ("Level progression": Letters), `.claude/skills/uzbek-text-rules/SKILL.md` |
| API used | `docs/api.md` § `core/text` (`toLetters`, `normalize`, `toLowerTr`, `scriptMeta`) |
| Skills | `tdd-task`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/I1-core-text-source-letters` |

## Goal
`sourceLetters(word, lang)` splits a Turkish, Russian, Persian or Arabic word into game letters, the counterpart
of `toLetters` for Uzbek, so a letter bank can be built for any pair.

## Acceptance criteria
- [ ] NFC first; Turkish lower-casing via `toLowerTr` (İ → i, I → ı); Russian lower-cased (ё kept distinct from е)
- [ ] One code point per letter for tr/ru; Turkish ç ş ğ ı ö ü are single letters
- [ ] fa/ar: harakat and tatweel dropped, letters returned in logical order; hamza-carrying forms (أ إ ؤ ئ آ) kept as written
- [ ] `sourceLetters(w, l).join('')` equals the normalized word with only the dropped marks removed
- [ ] Coverage ≥ 95% for the new code

## Test-first plan
- Red: `src/core/text/letters.test.ts`: `sourceLetters('İsim', 'tr')` is `['i','s','i','m']`
- Property: for any word, the joined letters round-trip as above, and no letter is empty or a lone combining mark

## Files likely touched
- `src/core/text/letters.ts` (or next to `toLetters`), `src/core/text/index.ts`, tests, `docs/api.md` (`npm run api`)

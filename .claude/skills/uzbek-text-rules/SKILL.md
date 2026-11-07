---
name: uzbek-text-rules
description: Use when code or content touches Uzbek, Turkish, Russian, Persian or Arabic text: normalization, letters, scripts, RTL.
---

# Uzbek & multi-script text rules

**All text logic lives in `src/core/text/`.** Games, UI, and content scripts import from there. If you need
a text operation that does not exist, add it to `core/text` with tests — never inline a regex in a game.

## Canonical forms
- **Unicode NFC** for everything stored or compared (`normalize()` in `core/text`).
- **Uzbek apostrophes**: o‘ and g‘ are officially written with U+02BB (ʻ, modifier letter turned comma);
  tutuq belgisi (glottal stop, e.g. *ma'no*) with U+02BC (ʼ). Users and sources type `'`, `‘`, `’`, `` ` ``, `ʻ`, `ʼ`.
  - **Storage/canonical**: `oʻ`, `gʻ` with U+02BB; tutuq with U+02BC.
  - **Comparison**: fold all variants via `foldApostrophes()` before comparing.
  - **Display**: canonical characters (fonts must cover U+02BB/U+02BC).
- **Turkish case**: `I`↔`ı`, `İ`↔`i`. Use `toLowerTr()` / `toUpperTr()` (locale `tr`), never bare
  `toLowerCase()` on Turkish strings.
- **Uzbek letters are not code points.** `sh`, `ch`, `ng`, `oʻ`, `gʻ` are single letters for games (word
  search, honeycomb, tile counts). Use `toLetters(word, 'uz-Latn')`. Exception: `s`+`h` across a morpheme
  boundary is rare; content may mark it with a zero-width non-joiner hint — the tokenizer respects it.
- Cyrillic Uzbek has its own letters: ў қ ғ ҳ (plus е/э, ё, ю, я, ц in loans).

## Transliteration (Uzbek only)
- Use `latnToCyrl()` / `cyrlToLatn()`. Content stores **both** forms; the converter is used to *generate
  and check* them, and the stored Cyrillic is authoritative when they disagree (loanwords like ц, word-initial е).
- Known edge cases: word-initial `e` → `э`, `ye` → `е`; `yo` → `ё`; `ts` in Russian loans → `ц`;
  `sh`/`ch` → `ш`/`ч`; `oʻ` → `ў`; `gʻ` → `ғ`; `ʼ` → `ъ`.
- Property: `cyrlToLatn(latnToCyrl(x)) === x` for native-Uzbek words in the test corpus.

## Scripts per language (product rule)
| Language | Script shown | Direction | `lang` attr |
|---|---|---|---|
| Uzbek | Latin **or** Cyrillic (player setting) | LTR | `uz-Latn` / `uz-Cyrl` |
| Turkish | Latin | LTR | `tr` |
| Russian | Cyrillic | LTR | `ru` |
| Persian | Perso-Arabic | **RTL** | `fa` |
| Arabic | Arabic | **RTL** | `ar` |

- Render with `<UzText>` / `<SourceText>` from `src/ui` which set `lang` and `dir` and pick the font stack.
  Use `scriptMeta(lang)` from `core/text` for `dir`/font metadata. Never hardcode `dir="rtl"`.
- Use logical CSS properties (`margin-inline-start`, `text-align: start`) so RTL tiles lay out correctly.
- Arabic/Persian: do not strip diacritics in stored data; comparison helpers may fold them.

## Checklist before you commit text code
- [ ] Inputs normalized (NFC + apostrophe fold) before comparison
- [ ] Turkish casing via locale-aware helpers
- [ ] Letter counts via `toLetters`, not `.length`
- [ ] `lang`/`dir` set via shared components
- [ ] Tests include: `oʻ` vs `o'` vs `o‘`, `İstanbul`/`ırmak`, `shahar`, `sinf`, an RTL word, a Cyrillic ў/қ/ғ/ҳ word

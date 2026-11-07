---
name: add-content-items
description: Use when adding, editing, importing, or reviewing vocabulary/content items (Uzbek words, cognate pairs, borrowings, suffixed forms) in content/ for any Uzbekible game. Covers the schema, both scripts, source citations, and validation.
---

# Adding content items

Content is data, reviewed like code. The schema is the single source of truth:
`src/core/content/schema.ts` (zod) → TS types → validator used by the app **and** `content/scripts/*`.

## Where things live
- `content/sources/` — raw inputs (frequency lists, dictionaries) + `SOURCES.md` with URL, license, date.
- `content/items/*.yaml` — curated items, one file per batch/topic (e.g. `pronouns.yaml`, `freq-0001-0100.yaml`).
- `content/scripts/` — pipeline CLI: `fetch → normalize → enrich → validate → review → build`.
- `public/content/*.json` — **generated** by `npm run content:build`; never edit by hand.

## Item shape (see schema for the authoritative version)
```yaml
- id: uz-koz                # stable, kebab, derived from canonical Latin
  uz: { latn: "koʻz", cyrl: "кўз" }
  freqRank: 312             # rank in the Uzbek frequency list (source in SOURCES.md)
  form: lemma               # lemma | inflected
  pos: noun
  glossEn: "eye"            # never shown on boards; long-press hint + QA only
  sources:
    - lang: tr
      text: "göz"           # native script of that language
      relation: turkic-cognate   # turkic-cognate | shared-arabic | shared-persian | russian-loan | other-loan
      confidence: high      # high | medium | low
      correspondence: ["g>k", "ö>oʻ"]   # sound-shift tags from core/similarity rules
      ref: "wiktionary:göz"            # citation key
  tags: [body]
```

## Rules
1. **Both Uzbek scripts** present. Generate the missing one with `core/text` transliteration, then check
   by hand for loanwords (ц, е/э, ё). Stored Cyrillic wins on disagreement — add a test case if the converter is wrong.
2. **Source text in its native script**: Turkish Latin, Russian Cyrillic, Persian/Arabic in Arabic script.
3. **Canonical apostrophes** (U+02BB in oʻ/gʻ, U+02BC for tutuq). Run the normalizer; see `uzbek-text-rules`.
4. Every source entry has a `relation`, `confidence`, and `ref`. No `ref` → `confidence: low` and listed in the review sheet.
5. **False friends** get `relation: false-friend` and are excluded from match boards by default (kept for future games).
6. Inflected items: `form: inflected`, with `lemma: <id>` and `suffixes: ["-da"]`, and the source form also inflected (evde ↔ uyda).
7. Never delete an item id that has shipped (learning logs reference it); mark `deprecated: true`.

## Validate
```bash
npm run content:validate   # schema + duplicates + script checks + transliteration check
npm run content:review     # regenerates docs/content/review.md for the user to spot-check
npm run content:build
```
Open the PR with the `content` label (see `pr-flow`). Include counts by relation/language in the PR body.

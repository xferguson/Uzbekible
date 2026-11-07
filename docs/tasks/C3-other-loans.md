# C3: Russian, Persian, Arabic loan mapping

| | |
|---|---|
| Status | done |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C1](C1-uzbek-frequency-list.md) |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C3-other-loans` |

## Goal
Add Russian, Persian, and Arabic partners (in native scripts) for top-1000 lemmas that have them.

## Acceptance criteria
- [x] `sources[lang=ru|fa|ar]` added with native script text (Cyrillic, Perso-Arabic, Arabic)
- [x] Relation, confidence, ref for each
- [x] PR summary: counts per language and relation

## Test-first plan
- `npm run content:validate` passes (once C5 merged)

## Files likely touched
- `content/items/**`

## Notes
Can run in parallel with C2; coordinate on files by splitting YAML per frequency band to avoid conflicts.

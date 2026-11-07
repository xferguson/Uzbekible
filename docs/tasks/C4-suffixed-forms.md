# C4: Suffixed-form pairs (evde ↔ uyda)

| | |
|---|---|
| Status | done |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C2](C2-turkish-cognates.md) |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C4-suffixed-forms` |

## Goal
Create inflected Uzbek↔Turkish pairs for Juft levels 31+.

## Acceptance criteria
- [x] ≥150 `form: inflected` items over the top-200 lemmas covering plural, possessive 1sg/2sg, locative, dative, ablative, past -di, present-continuous
- [x] Each has `lemma`, `suffixes`, and an inflected Turkish source
- [x] Tag pairs where suffixes diverge (-yap- vs -iyor-) as `divergent-suffix`

## Test-first plan
- `npm run content:validate` passes

## Files likely touched
- `content/items/inflected-*.yaml`

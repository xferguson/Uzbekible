# C2: Turkish cognate & shared-loan mapping

| | |
|---|---|
| Status | done |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C1](C1-uzbek-frequency-list.md) |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C2-turkish-cognates` |

## Goal
For every top-1000 lemma, find Turkish partners (Turkic cognates, shared Arabic/Persian loans) with confidence and sound-shift tags.

## Acceptance criteria
- [ ] `content/items/freq-*.yaml` items with `sources[lang=tr]` where a partner exists
- [ ] Each source: relation, confidence, correspondence tags, ref
- [ ] False friends recorded with `relation: false-friend`
- [ ] PR summary: coverage of top 100/200/500/1000, counts by relation and confidence, list of low-confidence items

## Test-first plan
- `npm run content:validate` passes (once C5 merged; otherwise YAML lint)

## Files likely touched
- `content/items/**`

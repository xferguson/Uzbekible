# C6: User review sheet for pairs

| | |
|---|---|
| Status | done |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C2](C2-turkish-cognates.md), [C3](C3-other-loans.md), [C5](C5-content-schema-pipeline.md) |
| Skills | `add-content-items`, `pr-flow` |
| Branch | `task/C6-content-review-sheet` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Give the user an easy way to spot-check pairs before they ship.

## Acceptance criteria
- [x] `docs/content/review.md` (generated) + a published Artifact table, filterable by relation/confidence/language
- [x] Low-confidence items listed first
- [x] PR labelled `needs-approval`

## Test-first plan
- n/a beyond C5's generator tests

## Files likely touched
- `docs/content/review.md`

## Outcome
- `docs/content/review.md` regenerated with `npm run content:review` (1262 items: 614 low / 480 medium / 527 high
  pairs; 224 items still have no source and count as low).
- Published review table: https://claude.ai/artifact/7WhoqDX3hXSPrt5AeJCtAd (one row per item × source pair,
  low confidence first; filter chips for confidence, relation and language; search; Latin/Cyrillic toggle; RTL
  Persian/Arabic). Built from the same `validateItems` + `itemConfidence` + `itemTransparency` as the sheet.

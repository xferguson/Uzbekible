# C6: User review sheet for pairs

| | |
|---|---|
| Status | todo |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C2](C2-turkish-cognates.md), [C3](C3-other-loans.md), [C5](C5-content-schema-pipeline.md) |
| Skills | `add-content-items`, `pr-flow` |
| Branch | `task/C6-content-review-sheet` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Give the user an easy way to spot-check pairs before they ship.

## Acceptance criteria
- [ ] `docs/content/review.md` (generated) + a published Artifact table, filterable by relation/confidence/language
- [ ] Low-confidence items listed first
- [ ] PR labelled `needs-approval`

## Test-first plan
- n/a beyond C5's generator tests

## Files likely touched
- `docs/content/review.md`

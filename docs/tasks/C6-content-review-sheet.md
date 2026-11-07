# C6: User review sheet for pairs

| | |
|---|---|
| Status | todo |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C2](C2-turkish-cognates.md), [C3](C3-other-loans.md), [C5](C5-content-schema-pipeline.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task C6 (User review sheet for pairs). Read CLAUDE.md and docs/tasks/C6-content-review-sheet.md first, and follow the skills it lists (add-content-items, pr-flow). Confirm that its dependencies (C2 and C3 and C5) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

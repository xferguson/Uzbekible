# R1: Juft v1 release checklist

| | |
|---|---|
| Status | todo |
| Lane | G Release |
| Depends on | [U8](U8-juft-e2e.md), [D3](D3-pwa-icon-set.md), [C6](C6-content-review-sheet.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `e2e-visual-check`, `pr-flow` |
| Branch | `task/R1-v1-release` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Ship Juft v1.

## Acceptance criteria
- [ ] Lighthouse: PWA installable, a11y ≥95, performance ≥90 on mobile
- [ ] Content review approved (C6)
- [ ] Final icons (D3) in manifest
- [ ] Deployed site URL in README; tag `v1.0.0`
- [ ] PRD status updated

## Test-first plan
- n/a

## Files likely touched
- `README.md`
- `docs/PRD.md`

## Session prompt (copy-paste)
```
Work on Uzbekible task R1 (Juft v1 release checklist). Read CLAUDE.md and docs/tasks/R1-v1-release.md first, and follow the skills it lists (e2e-visual-check, pr-flow). Confirm that its dependencies (U8 and D3 and C6) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

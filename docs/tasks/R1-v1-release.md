# R1: Juft v1 release checklist

| | |
|---|---|
| Status | todo |
| Lane | G Release |
| Read first | `docs/PRD.md` §7 (other docs only if needed) |
| Depends on | [U8](U8-juft-e2e.md), [D3](D3-pwa-icon-set.md), [C6](C6-content-review-sheet.md) |
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

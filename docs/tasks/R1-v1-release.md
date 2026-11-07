# R1: Juft v1 release checklist

| | |
|---|---|
| Status | done |
| Lane | G Release |
| Read first | `docs/PRD.md` §7 (other docs only if needed) |
| Depends on | [U8](U8-juft-e2e.md), [D3](D3-pwa-icon-set.md), [C6](C6-content-review-sheet.md) |
| Skills | `e2e-visual-check`, `pr-flow` |
| Branch | `task/R1-v1-release` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Ship Juft v1.

## Acceptance criteria
- [x] Lighthouse: PWA installable, a11y ≥95, performance ≥90 on mobile
- [x] Content review approved (C6)
- [x] Final icons (D3) in manifest
- [x] Deployed site URL in README; tag `v1.0.0`
- [x] PRD status updated

## Test-first plan
- n/a

## Files likely touched
- `README.md`
- `docs/PRD.md`

## Release evidence
- Lighthouse 12.2.1, mobile profile, local production build: performance 0.98, accessibility 1.00, best-practices 1.00. Lighthouse 12 has no PWA category; installability is covered by the manifest, maskable-icon and offline e2e tests (`e2e/offline.e2e.ts`, `src/games/juft/juft.e2e.ts`).
- C6 and D3 are `done` on `main`; D3 icons are served from the manifest (12 icon URLs checked in e2e).
- Tag `v1.0.0` is created on the merge commit after approval.

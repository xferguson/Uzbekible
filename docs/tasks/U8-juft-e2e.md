# U8: Juft e2e suite

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [U7](U7-juft-wiring.md), [T01](T01-pwa-deploy.md) |
| Skills | `e2e-visual-check`, `pr-flow` |
| Branch | `task/U8-juft-e2e` |

## Goal
Prove the whole thing in a real browser.

## Acceptance criteria
- [ ] Flows from the `e2e-visual-check` skill (complete, fail, replay, settings, offline) on phone + desktop
- [ ] Screenshots in PR

## Test-first plan
- Red: e2e written before any missing fixes

## Files likely touched
- `src/games/juft/juft.e2e.ts`

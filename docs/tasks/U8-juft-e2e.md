# U8: Juft e2e suite

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [U7](U7-juft-wiring.md), [T01](T01-pwa-deploy.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task U8 (Juft e2e suite). Read CLAUDE.md and docs/tasks/U8-juft-e2e.md first, and follow the skills it lists (e2e-visual-check, pr-flow). Confirm that its dependencies (U7 and T01) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

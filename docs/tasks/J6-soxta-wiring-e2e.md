# J6: Soxta wiring, registry entry and e2e

| | |
|---|---|
| Status | todo |
| Lane | J Soxta |
| Depends on | [J5](J5-soxta-board.md), [U6](U6-settings.md), [T01](T01-pwa-deploy.md) |
| Read first | `docs/games/05-soxta.md`, `.claude/skills/e2e-visual-check/SKILL.md` |
| API used | `docs/api.md` § `core/learning-log`, `core/storage`, game registry |
| Skills | `tdd-task`, `e2e-visual-check`, `pr-flow` |
| Branch | `task/J6-soxta-wiring-e2e` |

## Goal
Register Soxta as a `GameDefinition`, log every attempt, persist best score, and cover one full run end to end.

## Acceptance criteria
- [ ] Registered in the game registry and reachable from the home screen
- [ ] Every answer is written to the learning log with the item id and outcome
- [ ] Best streak and score persist in localStorage
- [ ] Playwright: play a seeded run to 3 mistakes, see results, replay; works offline
- [ ] Phone and desktop screenshots, light and dark

## Test-first plan
- Red: e2e starts Soxta, answers one card correctly, then loses 3 lives and sees the results screen

## Files likely touched
- `src/games/soxta/index.ts`, `src/games/registry.ts`, `e2e/soxta.spec.ts`

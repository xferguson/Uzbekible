# Q7: One game contract: GameDefinition types

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `.claude/skills/new-game-scaffold/SKILL.md`, `docs/technical-design.md` §5, task files E1, E3, U3 (other docs only if needed) |
| Depends on | [Q5](Q5-game-event-vocabulary.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q7-game-contract` |

## Goal
Settle the game contract before E1 and U3 build on different versions. Today the skill says `levels(level, settings, rng)`, E1 says `levelSpec(level, settings, history)`, the sim has its own `SimGame`, and none of them has a per-attempt RNG for Juft's "fresh shuffle every attempt".

## Acceptance criteria
- [ ] `src/games/types.ts` defines (types only, no shell) `GameDefinition`, `LevelSpec`, `LevelContext` (`settings`, `history` aggregates, level seed `<gameId>:<level>:<settingsHash>`), `BoardProps`, and `createRules(spec, attemptRng)`
- [ ] A pure `toSimGame(def, …)` helper (or documented mapping) shows the sim can be driven from a `GameDefinition` without a second contract
- [ ] `new-game-scaffold` skill, E1, E3 and U3 task text updated to the same signatures (U3 keeps GameShell + registry)
- [ ] Type-level test (`expectTypeOf`) for a minimal fake definition

## Test-first plan
- Red: Type test: a fake definition with `createRules(spec, attemptRng)` and history-aware `levels` fails to type-check against today's empty `types.ts`

## Files likely touched
- `src/games/types.ts` (+ `types.test.ts`)
- `.claude/skills/new-game-scaffold/SKILL.md`
- `docs/tasks/{E1,E3,U3}-*.md`

## Session prompt (copy-paste)
```
Work on Uzbekible task Q7 (One game contract: GameDefinition types). Read CLAUDE.md and docs/tasks/Q7-game-contract.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (Q5) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

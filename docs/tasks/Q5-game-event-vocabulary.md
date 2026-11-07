# Q5: Shared, typed game-event vocabulary + score tally

| | |
|---|---|
| Status | done |
| Lane | Q Quality |
| Read first | `docs/technical-design.md` §5, `docs/architecture.md` (`session`, `scoring`, `sim` rows) (other docs only if needed) |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q5-game-event-vocabulary` |

## Goal
Give rules, session, sim and (later) GameShell one event vocabulary. Today Juft emits `matched`/`mismatched`/`hintShown`, the sim counts `mistake`/`hint`/`combo`, so a Juft simulation would silently score 0 mistakes, 0 hints and 0 combos.

## Acceptance criteria
- [ ] `core/session` exports typed standard events (`lifeLost`, `complete`, `mistake`, `hint`, `combo`) and lets a game add its own typed events (generic `E` instead of `[key: string]: unknown`)
- [ ] `tallyScoreInput(events)` (in `core/session` or `core/scoring`) turns an event stream into `ScoreInput` counts; `core/sim` uses it instead of its own tally
- [ ] Juft rules emit `mistake` + `lifeLost` on a mismatch, `combo` on each consecutive correct match, `hint` on a hint (game detail such as tile ids stays in Juft-specific events or payload)
- [ ] Existing Juft, session and sim tests updated; behaviour otherwise unchanged

## Test-first plan
- Red: Unit: a session running Juft rules with one mismatch, one hint and two matches tallies `{ mistakes: 1, hints: 1, combos: 2 }`
- Property: for any action sequence, `tallyScoreInput(events).mistakes` equals lives lost

## Files likely touched
- `src/core/session/**`
- `src/core/sim/sim.ts`
- `src/games/juft/rules.ts` (+ tests)

## Session prompt (copy-paste)
```
Work on Uzbekible task Q5 (Shared, typed game-event vocabulary + score tally). Read CLAUDE.md and docs/tasks/Q5-game-event-vocabulary.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

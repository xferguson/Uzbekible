# Q5: Shared, typed game-event vocabulary + score tally

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/technical-design.md` §5, `docs/architecture.md` (`session`, `scoring`, `sim` rows) (other docs only if needed) |
| Depends on | none |
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

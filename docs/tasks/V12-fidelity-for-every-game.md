# V12: Mock fidelity as a standing rule for every design and game

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V7](V7-juft-fidelity-audit.md) |
| Read first | `.claude/skills/design-fidelity-review/SKILL.md`, `docs/design/fidelity-juft.md` (format only), `docs/design/frames.json`, `scripts/tasks.mjs` (the `frames` check), `e2e/states.ts` |
| Screens owned | none |
| API used | none |
| Skills | `tdd-task`, `design-fidelity-review`, `task-breakdown`, `pr-flow` |
| Branch | `task/V12-fidelity-for-every-game` |

## Goal
V7 audited Juft once. New designs and games arrive all the time, so "square up against the mocks" must be a rule the repo enforces for every game, not a one-off audit: no game screen ships without an approved frame, a fidelity table and a named owner for each gap.

## Acceptance criteria
- [ ] `npm run tasks -- frames` also fails when a state in `e2e/states.ts` has no entry in `docs/design/frames.json`, or an entry lists a PNG that does not exist; a state without a mockup yet must say so explicitly (`"pending": "<task id>"`) so the gap is visible and owned, never silent
- [ ] Registering a game in `src/games/all.ts` without map/ready/board/pause/fail/results states in `e2e/states.ts` fails the same check
- [ ] `_TEMPLATE.md` and `task-breakdown` require every new game's design task to add its frames to `frames.json`, and its wiring task to produce `docs/design/fidelity-<game>.md` (same table format as `fidelity-juft.md`) before merge
- [ ] `design-fidelity-review` and `pr-flow` state that the fidelity table is required in every UI PR for any game or screen, and that `fidelity-<game>.md` lists that game's open gaps until closed
- [ ] The existing Juft, Imlo and Soxta states pass the new check (missing frames marked `pending` with the owning task)

## Test-first plan
- Red: `scripts/tasks.test.ts`: a fixture states list with one state absent from the frame map makes `frames` report it; a fixture game with no states is reported; a `pending` entry passes

## Files likely touched
- `scripts/tasks.mjs`, `scripts/tasks.test.ts`
- `docs/design/frames.json`
- `docs/tasks/_TEMPLATE.md`, `docs/tasks/README.md`
- `.claude/skills/{design-fidelity-review,task-breakdown,pr-flow}/SKILL.md`

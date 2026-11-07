# V4: UI task rules: mockup frames in tasks, frame ownership, CLAUDE.md rule

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V1](V1-shots-script.md) |
| Read first | `CLAUDE.md`, `docs/tasks/_TEMPLATE.md`, `.claude/skills/task-breakdown/SKILL.md`, `scripts/tasks.mjs` (other docs only if needed) |
| API used | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/V4-ui-task-rules` |

## Goal
Make sure every approved mockup frame is owned by a task, and that UI tasks point builders at the frames rather than only the design brief. In v1 the home screen and page frame belonged to no task, and the UI tasks never named the D2 frames.

## Acceptance criteria
- [ ] `_TEMPLATE.md` gains a `Screens owned` row (frame ids from `docs/design/frames.json`, or `none`); for UI tasks, `Read first` lists those frame PNGs, and the acceptance criteria include "matches the owned frames at 360/390/1280, light and dark, comparison in the PR"
- [ ] `npm run tasks -- frames` (in `scripts/tasks.mjs`) fails when a frame in `frames.json` is claimed by no task, or by two tasks that are not `done`; it runs in the existing task-status CI step (no extra job)
- [ ] The `task-breakdown` skill tells authors to assign every frame when breaking down a game
- [ ] `CLAUDE.md` gains a non-negotiable: *UI is done when it matches the approved mockup at 360, 390 and 1280 in light and dark, shown side by side in the PR. Green tests don't prove UI. A defect visible in your own screenshots blocks the merge.*
- [ ] The `e2e-visual-check` and `ui-component` skills point to `npm run shots` and the review skill (V5)

## Test-first plan
- Red: Unit: a fixture `frames.json` with a frame no task claims makes `tasks frames` exit 1

## Files likely touched
- `docs/tasks/_TEMPLATE.md`
- `scripts/tasks.mjs` (+ test)
- `.claude/skills/task-breakdown/SKILL.md`
- `.claude/skills/{e2e-visual-check,ui-component}/SKILL.md`
- `CLAUDE.md`

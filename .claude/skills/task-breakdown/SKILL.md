---
name: task-breakdown
description: Use when writing or splitting task files in docs/tasks/ (new games, new lanes, follow-up work): sizing, dependencies, Read first, first red test, IDs, README update.
---

# Writing task files (Uzbekible)

The K tasks were cheap to run because each had a small scope, a precise `Read first` and a named red test. Keep new
task files that way. Start from [`docs/tasks/_TEMPLATE.md`](../../../docs/tasks/_TEMPLATE.md).

## Use it when
Games 2–4 need a queue, a review finding needs follow-up tasks, or an existing task is too big for one PR.
Not for doing a task (that is `tdd-task`).

## Sizing
- **≤ 400 non-generated diff lines** and **one module or one screen**. Over that, split along the module boundary.
- One PR, one task. If "Files likely touched" spans two `src/core/*` modules, or core plus UI, split it.
- Pure logic (core, rules) before UI that consumes it; the UI task depends on the logic task.

## Dependencies
- List only direct dependencies, as links; a task's `Depends on` must exist in `docs/tasks/` (`npm run tasks -- check`).
- **No cycles.** Draw the new lane first; every arrow points to an earlier task.
- Anything needing user sign-off (design mockups, content review, spikes, releases) is a 🔒 gate: add the 🔒 in the
  README row and an "Approval gate" note in the task file. Put gates **before** the UI that depends on them, and keep
  engine/content tasks off them so they run in parallel.

## Read first: name sections, not documents
Bad: `docs/architecture.md`. Good: `docs/architecture.md` (the `core/session` row), `docs/games/<game>.md` ("Rules").
Add only what the task cannot do without. For code the task *calls*, add the `API used` row.

## Frames: assign every one
When breaking down a game, give every state in `docs/design/frames.json` to exactly one task via its `Screens owned`
row (state ids in backticks, or `none`), and list those frame PNGs in the UI task's `Read first`. UI acceptance
criteria include "matches the owned frames at 360/390/1280, light and dark, comparison in the PR".
`npm run tasks -- frames` (CI) fails on an unowned frame, or one claimed by two unfinished tasks.

## First red test
Every task's "Test-first plan" names the **first failing test** (file and what it asserts), plus the invariant to
property-test if the logic is pure. Docs-only tasks say how they are validated instead.

## IDs and lanes
- ID = lane letter + next free number in that lane. Run `npm run tasks` and look at the README table first; never
  reuse or renumber an ID, even a finished one.
- New lane: pick an unused letter, add it to the lane diagram and give the table rows its name.
- Branch: `task/<ID>-<slug>`; file: `docs/tasks/<ID>-<slug>.md`.

## README update steps (same PR as the task files)
1. Add a row to the **Tasks** table, copying a neighbouring row: ID link (with 🔒 if gated), title, lane, depends on.
2. Update the **Parallel lanes** diagram (a new lane gets its own line).
3. Add the lane to the "Start right away" line if the first tasks have no dependencies.
4. `npm run tasks -- check` must print no problems; `npm run tasks` should list the new tasks in **Ready next** when
   their dependencies are done.

## Worked example
```markdown
# G2: core/hint-budget: points-costing hints

| | |
|---|---|
| Status | todo |
| Lane | G Game 2 |
| Depends on | [K4](K4-core-scoring-difficulty.md) |
| Read first | `docs/games/hint.md` ("Hint cost"), `docs/architecture.md` (`core/scoring` row) |
| API used | `docs/api.md` § `core/scoring` (`createTally`, `applyPenalty`) |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/G2-core-hint-budget` |

## Goal
Pure function that prices a long-press hint and refuses it when the score would go negative.

## Acceptance criteria
- [ ] `priceHint(level, tally)` returns `{cost, allowed}`; cost grows with level, from config
- [ ] Never returns an allowed hint that would take the tally below 0

## Test-first plan
- Red: `src/core/hint-budget/index.test.ts`: `priceHint(1, emptyTally)` is `{cost: 5, allowed: false}`
- Property: for any level and tally, `allowed` implies `tally.score - cost >= 0`

## Files likely touched
- `src/core/hint-budget/**`
```

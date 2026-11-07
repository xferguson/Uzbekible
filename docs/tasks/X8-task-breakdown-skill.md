# X8: `task-breakdown` skill for writing new task files

| | |
|---|---|
| Status | todo |
| Lane | X Harness |
| Read first | `docs/tasks/README.md`, `docs/tasks/_TEMPLATE.md`, `.claude/skills.md` (other docs only if needed) |
| Depends on | [X5](X5-docs-diet.md), [X6](X6-api-digest.md) |
| Skills | `pr-flow` |
| Branch | `task/X8-task-breakdown-skill` |

## Goal
Games 2–4 need new task queues. Capture what made the K tasks cheap to run (small scope, precise Read-first, a named red test) as a skill, so new task files stay that way.

## Acceptance criteria
- [ ] `.claude/skills/task-breakdown/SKILL.md`: when to use; sizing (≤ 400 non-generated lines, one module or screen); dependency rules (no cycles, design gates 🔒); `Read first` must name sections, not whole docs; every task names its first red test; IDs and lane letters must not collide (check `npm run tasks`)
- [ ] `_TEMPLATE.md` gains an `API used` row pointing at the `docs/api.md` sections the task calls
- [ ] Skill includes a short worked example (one task file) and the README update steps (lane diagram + table row)
- [ ] `.claude/skills.md` row added; the "Candidates for later" line updated

## Test-first plan
- Red: n/a (docs-only); validate by drafting one sample task from the skill in the PR body and running `npm run tasks -- check` on it

## Files likely touched
- `.claude/skills/task-breakdown/SKILL.md`, `.claude/skills.md`
- `docs/tasks/_TEMPLATE.md`

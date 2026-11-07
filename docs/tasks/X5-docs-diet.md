# X5: Docs diet: drop duplicated instructions from tasks and skills

| | |
|---|---|
| Status | todo |
| Lane | X Harness |
| Read first | `CLAUDE.md`, `.claude/skills/tdd-task/SKILL.md`, `.claude/skills/pr-flow/SKILL.md`, `docs/tasks/_TEMPLATE.md` (other docs only if needed) |
| Depends on | [X1](X1-gate-script.md) |
| Skills | `pr-flow` |
| Branch | `task/X5-docs-diet` |

## Goal
Cut what every session reads without losing any rule. Each rule should live in one place: CLAUDE.md for the session protocol, skills for procedures, task files for scope only.

## Acceptance criteria
- [ ] Every task file and `_TEMPLATE.md` loses its `## Session prompt (copy-paste)` block (CLAUDE.md "Do <ID>" replaces it); README "How to use" updated
- [ ] `tdd-task` §1 shrinks to a pointer to CLAUDE.md "Do <ID>" plus anything not already there; §5 and `pr-flow` say `npm run gate` instead of the four commands; CLAUDE.md's Fast gate line becomes `npm run gate`
- [ ] Red/Green evidence changes from "paste the output" to "failing test names + the summary line (e.g. `Tests 3 failed | 41 passed`)" in `tdd-task` and the PR template
- [ ] `_TEMPLATE.md` gains an optional `## Notes for next tasks` section (gotchas found while doing the task, e.g. Node import quirks) and drops the `Precondition` row (P0 is long since merged)
- [ ] No rule is dropped: a checklist in the PR body maps each removed sentence to where the rule still lives
- [ ] Total bytes of `docs/tasks/*.md` + `.claude/skills/*/SKILL.md` drop by ≥ 15% (`wc -c` before/after in the PR)

## Test-first plan
- Red: n/a (docs-only); the docs CI link check passes, and `npm run tasks -- check` (if X3 merged) still parses every task file

## Files likely touched
- `docs/tasks/*.md`, `docs/tasks/_TEMPLATE.md`, `docs/tasks/README.md`
- `.claude/skills/tdd-task/SKILL.md`, `.claude/skills/pr-flow/SKILL.md`, `CLAUDE.md`
- `.github/pull_request_template.md`

## Note
Many task files are touched; merge it while few task branches are open (others pick it up with a plain merge).

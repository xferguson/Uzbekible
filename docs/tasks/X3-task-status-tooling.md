# X3: Task board script + CI check that merged tasks are marked done

| | |
|---|---|
| Status | done |
| Lane | X Harness |
| Read first | `docs/tasks/README.md`, `.claude/skills/pr-flow/SKILL.md` (After merge) (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/X3-task-status-tooling` |

## Goal
Status drift has needed four clean-up PRs (#15, #28, #29, #31). Make status machine-checked and make "what can I do next?" a single command instead of reading every task file.

## Acceptance criteria
- [ ] `scripts/tasks.mjs` parses every `docs/tasks/<ID>-*.md` (`Status`, `Depends on`, 🔒 from the README) and the README table
- [ ] `npm run tasks` prints a compact table (ID, status, deps) and a **Ready next** list: status `todo` and every dependency `done`; 🔒 marked
- [ ] `npm run tasks -- check` fails when: a README ID has no task file or vice versa; a dependency ID does not exist; a `Status` is outside `todo | in progress | in review | done | on hold…`
- [ ] CI `docs` job runs `npm run tasks -- check` (no `npm ci` needed: plain Node, no deps)
- [ ] CI on a PR whose head branch is `task/<ID>-*` fails if `docs/tasks/<ID>-*.md` Status is not `done` once the PR is marked ready (not on drafts), so a task can't merge without being marked done
- [ ] `pr-flow` "After merge" and `CLAUDE.md` point at `npm run tasks` instead of manual checks

## Test-first plan
- Red: Unit test (`scripts/tasks.test.ts`) on fixture task files: A(done) ← B(todo) ← C(todo) gives Ready next = [B]; a missing dependency ID makes `check` fail

## Files likely touched
- `scripts/tasks.mjs`, `scripts/tasks.test.ts`, `package.json`
- `.github/workflows/ci.yml`
- `.claude/skills/pr-flow/SKILL.md`, `CLAUDE.md`

# V3: PR evidence check: UI changes need a mockup comparison

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | none |
| Read first | `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `.claude/skills/pr-flow/SKILL.md` (other docs only if needed) |
| API used | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/V3-pr-evidence-check` |

## Goal
Stop UI PRs from merging with "Screenshots: n/a" (PR #61 did, while adding three unstyled screens). Make it a CI job that reads the PR description from the event payload, so it makes no GitHub API calls and takes seconds.

## Acceptance criteria
- [ ] `scripts/pr-evidence.mjs <changed-files> <pr-body-file>` exits 1 when the diff touches `src/ui/**`, `src/shell/**`, `src/games/*/**/*.tsx` or any `*.css` and the PR body's Screenshots section is empty, says n/a, or names no comparison (an Artifact link or `shots/compare` reference)
- [ ] A `pr-evidence` job in `ci.yml` runs it on `pull_request` using `github.event.pull_request.body` and the `changes` job's file list, and `CI OK` requires it
- [ ] An escape hatch for non-visual UI changes (e.g. a hook refactor): the PR body states `Visual change: none` with a one-line reason, which the reviewer sees
- [ ] The PR template's Screenshots section explains the rule; the `pr-flow` skill says to run `npm run shots` and publish `compare.html`

## Test-first plan
- Red: Unit: a body with `## Screenshots / Artifact link\nn/a` plus a changed `src/shell/App.tsx` exits 1

## Files likely touched
- `scripts/pr-evidence.mjs` (+ test)
- `.github/workflows/ci.yml`
- `.github/pull_request_template.md`
- `.claude/skills/pr-flow/SKILL.md`

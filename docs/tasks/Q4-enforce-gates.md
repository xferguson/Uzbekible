# Q4: Enforce the unwritten gates: determinism lint, core in node env, Prettier in CI

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `CLAUDE.md` (Non-negotiables), `docs/architecture.md` (Layers, Quality gates) (other docs only if needed) |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q4-enforce-gates` |

## Goal
Turn rules that are only written down into checks: the determinism ban (non-negotiable 5), "core has no DOM", boundaries for `content/scripts`, and Prettier formatting.

## Acceptance criteria
- [ ] ESLint `no-restricted-properties`/`no-restricted-globals` reject `Math.random`, `Date.now`, `setTimeout`, `setInterval` in `src/**` (allowed in `src/core/clock/**` and `src/shell/**`), with a test proving a violation is reported
- [ ] `content/scripts/**` is a boundaries element allowed to import `core` only; lint test covers it
- [ ] `src/core/**` tests run in the `node` environment (Vitest `projects` or per-glob environment), so DOM use in core fails
- [ ] `npm run format:check` (`prettier --check .`) exists and runs in CI; the one-time `prettier --write .` is its own `style:` commit

## Test-first plan
- Red: Lint test: `Math.random()` in `src/games/x.ts` and `import '../src/ui/index'` in `content/scripts/x.ts` are not reported today

## Files likely touched
- `eslint.config.js`
- `scripts/lint-boundaries.test.ts`
- `vite.config.ts`
- `package.json`
- `.github/workflows/ci.yml`
- ~34 files reformatted (generated)

## Note
The Prettier pass touches many files: merge it while few branches are open; other branches pick it up with a plain `git merge origin/main`.

## Session prompt (copy-paste)
```
Work on Uzbekible task Q4 (Enforce the unwritten gates: determinism lint, core in node env, Prettier in CI). Read CLAUDE.md and docs/tasks/Q4-enforce-gates.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

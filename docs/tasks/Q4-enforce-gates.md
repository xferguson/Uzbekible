# Q4: Enforce the unwritten gates: determinism lint, core in node env, Prettier in CI

| | |
|---|---|
| Status | done |
| Lane | Q Quality |
| Read first | `CLAUDE.md` (Non-negotiables), `docs/architecture.md` (Layers, Quality gates) (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q4-enforce-gates` |

## Goal
Turn rules that are only written down into checks: the determinism ban (non-negotiable 5), "core has no DOM", boundaries for `content/scripts`, and Prettier formatting.

## Acceptance criteria
- [x] ESLint `no-restricted-properties`/`no-restricted-globals` reject `Math.random`, `Date.now`, `setTimeout`, `setInterval` in `src/**` (allowed in `src/core/clock/**` and `src/shell/**`), with a test proving a violation is reported
- [x] `content/scripts/**` is a boundaries element allowed to import `core` only; lint test covers it
- [x] `src/core/**` tests run in the `node` environment (Vitest `projects` or per-glob environment), so DOM use in core fails
- [x] `npm run format:check` (`prettier --check .`) exists and runs in CI; the one-time `prettier --write .` is its own `style:` commit

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

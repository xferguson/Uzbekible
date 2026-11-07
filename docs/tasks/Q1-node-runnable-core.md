# Q1: Node-runnable core imports + CLI smoke in CI

| | |
|---|---|
| Status | done |
| Lane | Q Quality |
| Read first | `docs/technical-design.md` §2–3, `docs/architecture.md` (Quality gates) (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q1-node-runnable-core` |

## Goal
Make every `src/core` and `src/games` module importable by plain Node (`--experimental-strip-types`), so `npm run content:*` and `npm run sim` work, and make CI prove it stays that way. Today `npm run content:validate` crashes with `ERR_MODULE_NOT_FOUND …/similarity/distance`.

## Acceptance criteria
- [x] All relative imports in `src/core/**` and `src/games/**` use explicit `.ts` extensions (e.g. `core/similarity`, `core/session`, `games/juft`)
- [x] An ESLint rule (e.g. `import/extensions` or `no-restricted-syntax` on extensionless relative specifiers) fails on an extensionless relative import in those folders; `scripts/lint-boundaries.test.ts` (or a sibling test) proves it
- [x] CI `app` job runs `npm run content:validate` and `npm run sim -- --game demo --levels 1-2 --runs 5` after the unit tests
- [x] `scripts/stub.mjs` deleted (no script references it)

## Test-first plan
- Red: CI step `npm run content:validate` fails on `main` (paste the `ERR_MODULE_NOT_FOUND` output); lint test for the extension rule fails before the rule exists

## Files likely touched
- `src/core/**` (import specifiers only)
- `src/games/juft/rules.ts`
- `eslint.config.js`
- `scripts/lint-boundaries.test.ts`
- `.github/workflows/ci.yml`
- `scripts/stub.mjs` (delete)

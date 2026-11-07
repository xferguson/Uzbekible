# Q1: Node-runnable core imports + CLI smoke in CI

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/technical-design.md` §2–3, `docs/architecture.md` (Quality gates) (other docs only if needed) |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q1-node-runnable-core` |

## Goal
Make every `src/core` and `src/games` module importable by plain Node (`--experimental-strip-types`), so `npm run content:*` and `npm run sim` work, and make CI prove it stays that way. Today `npm run content:validate` crashes with `ERR_MODULE_NOT_FOUND …/similarity/distance`.

## Acceptance criteria
- [ ] All relative imports in `src/core/**` and `src/games/**` use explicit `.ts` extensions (e.g. `core/similarity`, `core/session`, `games/juft`)
- [ ] An ESLint rule (e.g. `import/extensions` or `no-restricted-syntax` on extensionless relative specifiers) fails on an extensionless relative import in those folders; `scripts/lint-boundaries.test.ts` (or a sibling test) proves it
- [ ] CI `app` job runs `npm run content:validate` and `npm run sim -- --game demo --levels 1-2 --runs 5` after the unit tests
- [ ] `scripts/stub.mjs` deleted (no script references it)

## Test-first plan
- Red: CI step `npm run content:validate` fails on `main` (paste the `ERR_MODULE_NOT_FOUND` output); lint test for the extension rule fails before the rule exists

## Files likely touched
- `src/core/**` (import specifiers only)
- `src/games/juft/rules.ts`
- `eslint.config.js`
- `scripts/lint-boundaries.test.ts`
- `.github/workflows/ci.yml`
- `scripts/stub.mjs` (delete)

## Session prompt (copy-paste)
```
Work on Uzbekible task Q1 (Node-runnable core imports + CLI smoke in CI). Read CLAUDE.md and docs/tasks/Q1-node-runnable-core.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

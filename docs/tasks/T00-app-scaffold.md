# T00: App scaffold (Vite + React + TS, Vitest, Playwright, lint)

| | |
|---|---|
| Status | todo |
| Lane | A Foundation |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow`, `e2e-visual-check` |
| Branch | `task/T00-app-scaffold` |

## Goal
Create the runnable app skeleton and turn on CI code jobs, so every later task has a place to put tests and code.

## Acceptance criteria
- [ ] `npm ci && npm run dev` serves a placeholder home screen titled “Uzbekible”
- [ ] Scripts exist: `dev`, `build`, `preview`, `test`, `typecheck`, `lint`, `format`, `e2e`, `content:validate|review|build` (content scripts may be stubs that exit 0 with a TODO), `sim` (stub)
- [ ] TypeScript strict; path alias `@core/*`, `@ui/*`, `@design/*`, `@games/*`
- [ ] Folder skeleton from `docs/technical-design.md` §2 with `index.ts` placeholders
- [ ] Vitest + Testing Library configured (jsdom); one smoke test for `<App/>`
- [ ] Playwright configured with `phone` and `desktop` projects; one smoke e2e that loads the home page
- [ ] Test-build hooks: `?seed=` and `?clock=fake` parsed by a tiny `src/shell/testHooks.ts` (tested), `window.__uzbekibleTest` only in test builds
- [ ] `.nvmrc` with current Node LTS; lockfile committed
- [ ] CI code jobs (lint, typecheck, test, build, e2e) run and pass on the PR

## Test-first plan
- Red: smoke test for App rendering title fails before App exists
- Red: testHooks parses `?seed=42&clock=fake` → `{seed: 42, fakeClock: true}`

## Files likely touched
- `package.json`
- `vite.config.ts`
- `tsconfig*.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `src/**`
- `e2e/smoke.e2e.ts`
- `.nvmrc`

## Session prompt (copy-paste)
```
Work on Uzbekible task T00 (App scaffold (Vite + React + TS, Vitest, Playwright, lint)). Read CLAUDE.md and docs/tasks/T00-app-scaffold.md first, and follow the skills it lists (tdd-task, pr-flow, e2e-visual-check). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

# T00: App scaffold (Vite + React + TS, Vitest, Playwright, lint)

| | |
|---|---|
| Status | done |
| Lane | A Foundation |
| Read first | `docs/technical-design.md` §1–2, §8–9 (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow`, `e2e-visual-check` |
| Branch | `task/T00-app-scaffold` |

## Goal
Create the runnable app skeleton and turn on CI code jobs, so every later task has a place to put tests and code.

## Acceptance criteria
- [x] `npm ci && npm run dev` serves a placeholder home screen titled “Uzbekible”
- [x] Scripts exist: `dev`, `build`, `preview`, `test`, `typecheck`, `lint`, `format`, `e2e`, `content:validate|review|build` (content scripts may be stubs that exit 0 with a TODO), `sim` (stub)
- [x] TypeScript strict; path alias `@core/*`, `@ui/*`, `@design/*`, `@games/*`
- [x] Folder skeleton from `docs/technical-design.md` §2 with `index.ts` placeholders
- [x] Vitest + Testing Library configured (jsdom); one smoke test for `<App/>`
- [x] Playwright configured with `phone` and `desktop` projects; one smoke e2e that loads the home page
- [x] Test-build hooks: `?seed=` and `?clock=fake` parsed by a tiny `src/shell/testHooks.ts` (tested), `window.__uzbekibleTest` only in test builds
- [x] `.nvmrc` with current Node LTS; lockfile committed
- [x] CI code jobs (lint, typecheck, test, build, e2e) run and pass on the PR

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

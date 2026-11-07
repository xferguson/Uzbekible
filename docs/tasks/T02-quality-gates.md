# T02: Import boundaries, coverage thresholds, fast-check

| | |
|---|---|
| Status | todo |
| Lane | A Foundation |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/T02-quality-gates` |

## Goal
Enforce architecture and quality bars in CI so parallel agents can't erode them.

## Acceptance criteria
- [ ] `eslint-plugin-boundaries` rules exactly as in `docs/architecture.md` (core→core only; ui↛games/shell; games/a↛games/b)
- [ ] A deliberately bad import in a fixture is reported (lint test or documented manual check in PR)
- [ ] Vitest coverage thresholds: `src/core/**` ≥95% lines+branches, `src/ui/**` ≥80%; CI fails below
- [ ] `fast-check` installed; example property test in `src/core/_example/` and convention documented (`*.property.test.ts`)
- [ ] `eslint-plugin-jsx-a11y` enabled

## Test-first plan
- Red: a fixture importing `@ui` from `@core` fails lint

## Files likely touched
- `.eslintrc / eslint.config.js`
- `vitest.config.ts`
- `src/core/_example/*`

## Session prompt (copy-paste)
```
Work on Uzbekible task T02 (Import boundaries, coverage thresholds, fast-check). Read CLAUDE.md and docs/tasks/T02-quality-gates.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

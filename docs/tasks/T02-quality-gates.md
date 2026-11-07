# T02: Import boundaries, coverage thresholds, fast-check

| | |
|---|---|
| Status | done |
| Lane | A Foundation |
| Read first | `docs/technical-design.md` §1–2, §8–9 (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
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

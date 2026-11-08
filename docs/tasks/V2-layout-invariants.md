# V2: Layout-invariant e2e suite for every screen state

| | |
|---|---|
| Status | done |
| Lane | V Visual quality |
| Depends on | [V1](V1-shots-script.md) |
| Read first | `e2e/layout.e2e.ts` (from PR #65), `.claude/skills/e2e-visual-check/SKILL.md` (other docs only if needed) |
| API used | none |
| Skills | `tdd-task`, `e2e-visual-check`, `pr-flow` |
| Branch | `task/V2-layout-invariants` |

## Goal
Catch the class of bug that shipped in v1 (bare browser buttons, clipped labels, cards wider than the screen) with deterministic checks rather than image comparisons. This generalises `e2e/layout.e2e.ts` to every state in `e2e/states.ts`.

## Acceptance criteria
- [x] For every state, at the given widths, in light and dark, assert: no horizontal page overflow; no text element with `scrollWidth > clientWidth` (clipping); no interactive element outside the viewport; no `button`/`input`/`select` with the browser's default ButtonFace background or default font; interactive targets ≥ 44×44 px; axe `color-contrast` passes (`@axe-core/playwright`)
- [x] CI runs the cheap subset (360 and 1280, light and dark) inside the existing e2e job; `npm run e2e:layout` runs the full matrix (320, 360, 390, 768, 1280) in the cloud session
- [x] The PR #65 tests are folded in; no behaviour test changes
- [x] Adding a state to `e2e/states.ts` automatically covers it

## Test-first plan
- Red: Point the suite at the v1.0.0 build's results screen at 360 px: overflow fails (`scrollWidth 555 > 360`). Keep that as a fixture-based test of the checker itself (an over-wide test page)

## Files likely touched
- `e2e/layout.e2e.ts`
- `e2e/layout-checks.ts`
- `package.json` (`@axe-core/playwright`, `e2e:layout`)
- `playwright.config.ts`

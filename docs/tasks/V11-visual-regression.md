# V11: Visual-regression baselines, run in the cloud session

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V8](V8-juft-frame-home-settings.md), [V9](V9-juft-level-map.md), [V10](V10-juft-results-overlays-board.md) |
| Read first | `.claude/skills/e2e-visual-check/SKILL.md`, `playwright.config.ts` (other docs only if needed) |
| API used | none |
| Skills | `e2e-visual-check`, `tdd-task`, `pr-flow` |
| Branch | `task/V11-visual-regression` |

## Goal
Lock in the D2-faithful look once V8–V10 have landed, so later changes can't silently degrade it. Baselines are taken after the fidelity pass, not before, so they don't freeze the wrong design.

## Acceptance criteria
- [ ] `npm run e2e:visual` uses `toHaveScreenshot` for the key states in `e2e/states.ts` (phone 390 and desktop, light and dark), with fonts loaded, reduced motion, fixed seed and fake clock
- [ ] Baselines are generated and checked in the cloud session's Chromium (`/opt/pw-browsers/chromium`); **not run in GitHub Actions**, to avoid cross-environment rendering noise and CI minutes
- [ ] The `pr-flow` skill makes `npm run e2e:visual` a required local step before merging a UI PR; updating a baseline (`-u`) needs the design-reviewer table and the user's approval
- [ ] The "visual regression deferred" lines in the `e2e-visual-check` skill and the PRD are updated

## Test-first plan
- Red: Change one token colour locally: `npm run e2e:visual` fails with a diff image

## Files likely touched
- `e2e/visual.e2e.ts`
- `e2e/__screenshots__/**` (generated)
- `package.json`
- `.claude/skills/{e2e-visual-check,pr-flow}/SKILL.md`
- `docs/PRD.md`

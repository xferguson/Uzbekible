# V1: `npm run shots`: app screenshots paired with D2 frames

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | none |
| Read first | `.claude/skills/e2e-visual-check/SKILL.md`, `docs/design/mockups/README.md`, the D2 frames in `docs/design/mockups/screens/` (other docs only if needed) |
| API used | none |
| Skills | `tdd-task`, `e2e-visual-check`, `pr-flow` |
| Branch | `task/V1-shots-script` |

## Goal
Remove the effort that made "Screenshots: n/a" tempting. One command drives the real app into every D2 state and writes a page that puts each app screenshot next to its approved mockup frame. It runs in the agent's cloud session, never in GitHub Actions.

## Acceptance criteria
- [ ] `e2e/states.ts`: one list of screen states (home, settings, map early/late, ready, countdown, board 1/3/6/8/12 pairs, wrong/cracked, long-press hint, pause, results 1/2/3 stars, fail), each with a function that reaches it using `?seed=`, `?clock=fake` and the `window.__uzbekibleTest` hooks; new games add their states to it
- [ ] `docs/design/frames.json` maps each state to its D2 frame file(s) (phone and desktop)
- [ ] `npm run shots` runs Playwright at 360×780, 390×844 and 1280×800 in light and dark with reduced motion and fonts loaded, and writes `shots/<state>-<width>-<scheme>.png` (gitignored)
- [ ] It also writes `shots/compare.html`, with app on the left and mockup on the right for every state × width × scheme, and missing frames flagged, ready to publish as an Artifact for review
- [ ] `npm run shots -- --states map,results` limits the run; it finishes in under 2 minutes for all states on a cloud session
- [ ] Not added to CI

## Test-first plan
- Red: A unit test for the state→frame mapping fails: every state in `e2e/states.ts` must have an entry in `frames.json` and every referenced frame file must exist

## Files likely touched
- `e2e/states.ts`
- `scripts/shots.mjs` (+ test)
- `docs/design/frames.json`
- `package.json`
- `.gitignore`

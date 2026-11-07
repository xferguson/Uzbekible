---
name: e2e-visual-check
description: Use when writing or running Playwright e2e tests, taking screenshots, or checking PWA/offline behaviour.
---

# E2E & visual checks

## Environment notes (cloud sessions)
- Chromium + Playwright are pre-installed. **Do not run `playwright install`.** If the project pins a
  different `@playwright/test`, launch with `executablePath: '/opt/pw-browsers/chromium'`.
- Always pass `--trace off` unless debugging a failure (then rerun only that test with `--trace on`):
  `npm run e2e -- --trace off`.
- Screenshots a person will see: `deviceScaleFactor: 2`. Screenshots only you inspect: `1`.

## Conventions
- Tests in `e2e/` (shell flows) and `src/games/<id>/<id>.e2e.ts` (game flows).
- Projects: `phone` (iPhone 13 emulation, default) and `desktop` (1280×800).
- Determinism: the app reads `?seed=<n>` and `?clock=fake` in test builds so boards are reproducible.
  Never rely on wall-clock timing; use the test clock hooks exposed on `window.__uzbekibleTest` (test builds only).
- Select by role/label (`getByRole('button', { name: 'koʻz' })`), never CSS classes.
- Clear localStorage in `beforeEach` unless the test is about persistence.

## Required flows per game (minimum)
1. Start level 1 → complete it → results shown → next level unlocked → progress persisted after reload.
2. Make 3 mistakes → level fails → restart works.
3. Replay an earlier level → best score updates only if higher.
4. Settings: switch Uzbek script to Cyrillic → board shows Cyrillic; toggle off a source language → its items disappear.
5. Offline: after first load, `context.setOffline(true)` → reload → app and current game still work.

## Visual check of a change: `npm run shots`
1. `npm run shots` (≈1 min, cloud session only, never CI) builds the e2e bundle, drives the app into every state in
   `e2e/states.ts` at 360×780, 390×844 and 1280×800, light and dark, reduced motion, fonts loaded, and writes
   `shots/<state>-<width>-<scheme>.png` plus `shots/compare.html` (app left, approved mockup right, missing frames
   and failed states flagged). Limit it: `-- --states map,results` (ids or prefixes), `-- --games juft`,
   `-- --url <running server>`.
2. Look at the shots yourself before claiming the change works. Publish `shots/compare.html` with the `shots/`
   images it references (`*.png`, `frames/*.png`) as an Artifact and link it in the PR (Screenshots section).
3. To show a live server instead, `npm run build && npm run preview` and report the port with the preview-port tool.

## Screen states (`e2e/states.ts`)
- One `ScreenState` per screen: `{ id, game, title, reach(driver) }`. Shell screens are in `e2e/states/shell.ts`;
  each game owns `e2e/states/<gameId>.ts` and is spread into `STATES`. V2's layout checks run over the same list, so
  a new state gets layout coverage for free.
- `reach` uses the game-agnostic `Driver` (`e2e/shots/driver.ts`): `open({ progress, settings })` seeds storage and
  freezes Playwright's clock; `openGame`, `startLevel(n, { countdownMs })`, `tap`, `advance(ms)`,
  `advanceUntil(cond)`, `check(ok, msg)`. Game-specific moves (tiles, answers) stay in the game's state file.
- Time never moves unless the state advances it, so flashes, hints and countdowns hold still. Advance with
  `advanceUntil` (small steps) when the app may register a timer after the first step.
- A state must `check` it reached its target (pair count, stars, heading); a wrong screen is worse than none.
  Derive timings from the game's config (see `playMsFor` in `e2e/states/juft.ts`), not magic numbers.
- Every state needs an entry in `docs/design/frames.json` (`phone`/`desktop` frame lists, `{scheme}` filled in;
  `[]` = no frame yet). `scripts/shots.test.ts` fails if a state, an entry or a frame file is missing, and if a
  game folder with a `definition.ts` has no states.

Visual regression snapshots are **deferred** (see `docs/PRD.md` › Later); do not add `toHaveScreenshot`
assertions yet.


UI work is judged against the approved frames, not by green tests: run `npm run shots`, compare each pair side by side, and run the design-fidelity review (skill added by V5) before merging.

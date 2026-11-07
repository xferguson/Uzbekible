---
name: e2e-visual-check
description: Use when writing or running Playwright end-to-end tests, checking a UI change in a real browser, taking screenshots, or verifying PWA/offline behaviour in Uzbekible.
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

## Visual check of a change
1. `npm run build && npm run preview` (or `npm run dev`).
2. Report the port with the preview-port tool if the user may want to look.
3. Screenshot phone + desktop, light + dark; look at them yourself before claiming the change works.
4. Attach screenshots to the PR (Screenshots section).

Visual regression snapshots are **deferred** (see `docs/PRD.md` › Later); do not add `toHaveScreenshot`
assertions yet.

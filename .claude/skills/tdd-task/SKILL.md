---
name: tdd-task
description: Use when starting any docs/tasks/ task (T00, K1, E3, U4, C5…) or any code change: red-green-refactor loop and done criteria.
---

# TDD task workflow (Uzbekible)

Every code change in this repo is test-first. A task is not done until its tests prove it.

## 1. Load the task
Follow CLAUDE.md "Do <ID>" (read the task file and its `Read first` docs, check dependencies with `npm run tasks`,
branch `task/<ID>-<slug>` unless one was assigned). Also read the `docs/architecture.md` row of any shared module you
will use. Never re-implement another task's scope.

## 2. Red
- Translate each acceptance criterion into one or more failing tests **before** writing implementation.
- Pure logic lives in `src/core/**` → Vitest unit tests next to the file: `foo.ts` + `foo.test.ts`.
- Invariants (round-trips, permutations, bounds, monotonicity) → add a **fast-check** property test
  (`foo.property.test.ts`). Required for: text/transliteration, random/shuffle, scoring, difficulty,
  storage migrations, motif geometry.
- UI → Testing Library tests (`Component.test.tsx`), asserting behaviour via roles/labels, not classes.
- Run `npm test -- <path>` and note the failing test names plus the summary line (e.g. `Tests 3 failed | 41 passed`) for the PR body ("Red evidence").
- Commit: `test(<area>): <behaviour> [<ID>]`.

## 3. Green
- Write the minimum code to pass. No speculative options.
- Reuse shared modules (`core/text`, `core/random`, `core/clock`, `core/session`, `core/scoring`, ...) —
  never re-implement shuffle, timers, normalization, scoring maths or storage in a game folder.
- Run the test again and note the summary line ("Green evidence").
- Commit: `feat(<area>): <behaviour> [<ID>]`.

## 4. Refactor
- Remove duplication, name things well, keep functions small. Tests stay green.
- Commit: `refactor(<area>): ... [<ID>]` (optional).

- If you changed a module's exports (added, removed or re-signed), run `npm run api` and commit `docs/api.md`; CI fails on a stale digest.

## 5. Before opening the PR — run the fast gate
```bash
npm run gate   # quiet lint → typecheck → test+coverage → build; ends in GATE OK
```
Delegate the full gate to the `gate-runner` agent when you want only the verdict: it replies `GATE OK` or the
failing step plus ≤ 20 lines of errors, keeping long logs out of your context. Run a single test file or step
yourself; a few lines of output aren't worth a spawn.

Coverage thresholds: `src/core` ≥ 95% lines/branches, `src/ui` ≥ 80%. If e2e is relevant, see the
`e2e-visual-check` skill.

## 6. Ship
Follow the `pr-flow` skill. Put Red/Green evidence in the PR template. Set the `Status` row in the task file to
`in review` while the PR is open, and to `done` in the same PR before you merge it (status lives in each task file, never in the README index, to avoid merge conflicts).

## Rules
- One task per PR. If you discover extra scope, add a new task file (follow `docs/tasks/_TEMPLATE.md`)
  instead of growing the PR.
- Never skip, `.only`, or delete a test to get green. Never lower coverage thresholds.
- Deterministic tests only: inject `Clock` and `Rng` (from `core/clock`, `core/random`); no real
  `Date.now()`, `Math.random()`, or timers in tests.
- No English text on game boards (product rule) — see `docs/PRD.md`.

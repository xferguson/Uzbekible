---
name: game-balance-tuning
description: Use when changing difficulty curves, level parameters, scoring formulas or weights, star thresholds, lives, timers, or speed ramps in any Uzbekible game, or when a level feels too easy/hard. Requires config-only changes validated by the seeded simulation bot.
---

# Game balance tuning

Numbers live in config, formulas live in core, and changes are justified by simulation, not vibes.

## Where things live
- Formulas: `src/core/scoring/` (time decay, combo, penalties, stars) and `src/core/difficulty/` (curves).
  Changing a **formula** is a normal TDD task with property tests (monotonicity, bounds, never negative).
- Parameters: `src/games/<id>/scoring.config.ts`, `src/games/<id>/difficulty.config.ts`.
  Changing **parameters** is a tuning task (this skill).
- Simulator: `src/core/sim/` — a seeded bot that plays a game's rules with configurable skill profiles
  (`novice`, `b1-turkish`, `expert`: per-item accuracy and response-time distributions), using `core/random`
  and the fake `core/clock`.

## Invariants (property tests must keep these true)
- Score ≥ 0; faster completion never scores lower, all else equal; more mistakes never score higher.
- Difficulty parameters are non-decreasing in level number (except designated "breather" / "hard-pair" levels,
  which are declared explicitly in config).
- Star thresholds are achievable by the `expert` profile and 1-star is achievable by `novice` for levels 1–5.

## Procedure
1. State the goal ("level 3–6 failure rate for b1-turkish should be 10–25%").
2. Run `npm run sim -- --game <id> --levels 1-30 --profiles novice,b1-turkish,expert --runs 500 --seed 1`
   to get a baseline table (completion rate, median time, median score, stars distribution per level).
3. Change only config values. Re-run with the same seed. Compare tables.
4. Commit the config change **and** the before/after table in `docs/games/<NN>-<id>-balance.md`.
5. If real play data exists (exported learning log), compare its per-level stats with the `b1-turkish`
   profile and recalibrate the profile — note it in the balance doc.

## Don'ts
- No magic numbers in components or rules files.
- Don't tune by editing tests' expected values; fix config or formula with a reason.

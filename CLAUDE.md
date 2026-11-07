# Uzbekible: working agreement for agents

Uzbekible is a PWA of arcade-style games that use Uzbek as the medium of play. It is **a game, not a course**.
Behind it is a research question: *Given intermediate (B1) Turkish, what is the fastest path to Uzbek?*

## Read first
- Product: `docs/PRD.md` (and the per-game specs in `docs/games/`)
- Design: `docs/design/brief.md` (Uzbek tilework visual identity)
- Engineering: `docs/technical-design.md`, `docs/architecture.md`
- Work queue: `docs/tasks/README.md` (task index, dependencies, gates); status lives in each task file
- Skills: `.claude/skills.md`. Skills in `.claude/skills/` load automatically; follow them.

## "Do <ID>" (how sessions start)
When the user says **"Do D1"**, **"Do C1"**, **"work on K3"** or similar, that's a task ID from `docs/tasks/`:
1. Open `docs/tasks/<ID>-*.md` and read it in full. That file is the task's spec and its session prompt.
2. Check its dependencies against `main` (the `Status` row of each dependency's task file, plus `git log origin/main`).
   If one isn't merged, say which one and stop.
3. Follow the skills the task lists (always `tdd-task` and `pr-flow`), on branch `task/<ID>-<slug>`, unless the
   session was assigned a branch.
4. Finish the task: PR, CI green, then merge it, or wait for approval if the task is 🔒.

## Non-negotiables
1. **Red-green TDD.** Write a failing test first, then the code. See the `tdd-task` skill.
2. **One task per PR**, small enough to run in parallel with other work. Everything merges into `main` through a PR.
   See the `pr-flow` skill.
3. **Merging:** the agent merges its own PR once CI is green. Approval-gated tasks (🔒: D1, D2, C6, S1, S2, R1)
   wait for the user's explicit approval in the session first. See the `pr-flow` skill.
4. **Reuse shared modules.** Timers, randomness, scoring, difficulty, text handling, storage and logging live in
   `src/core/`; tiles, HUD, map and results live in `src/ui/`. Games only add rules and layout.
   Lint enforces the import boundaries in `docs/architecture.md`.
5. **Deterministic tests:** inject `Clock` and `Rng`. Never use `Date.now()`, `Math.random()` or real timers in tests.
6. **Quality bar:** `src/core` coverage ≥ 95%, `src/ui` ≥ 80%. fast-check property tests for invariants.
7. **Product rules:**
   - No English on game boards. English appears only as a points-costing long-press hint.
   - Uzbek can be shown in Latin or Cyrillic (a player setting). Every other language is always shown in its
     native script (Turkish Latin, Russian Cyrillic, Persian and Arabic in Arabic script, RTL).
   - No accounts. All state lives in localStorage.
   - The visual identity comes from Uzbek tilework and architecture, and the motif should serve the mechanics.
8. **Text** is handled only through `src/core/text` (see the `uzbek-text-rules` skill).

## Commands (once the scaffold, task T00, lands)
```bash
npm ci
npm run dev            # local dev server
npm test               # vitest (add -- --coverage for thresholds)
npm run lint && npm run typecheck
npm run build && npm run preview
npm run e2e -- --trace off
npm run content:validate | content:review | content:build
npm run sim -- --game juft --levels 1-30
```

## Branches and commits
- Branch: `task/<ID>-<slug>`, or the branch a session is assigned.
- Commits: Conventional Commits with the task ID, e.g. `feat(core/random): seeded shuffle [K2]`.

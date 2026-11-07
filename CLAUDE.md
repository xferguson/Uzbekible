# Uzbekible: working agreement for agents

PWA of arcade-style games that use Uzbek as the medium of play: **a game, not a course**. Research question:
*given intermediate (B1) Turkish, what is the fastest path to Uzbek?*

## Where things are (read on demand, not up front)
`docs/PRD.md` product · `docs/games/` game specs · `docs/design/brief.md` look · `docs/technical-design.md` and
`docs/architecture.md` engineering · `docs/api.md` generated export signatures (read this instead of opening `src/core/*/index.ts`; `npm run api` regenerates) · `docs/tasks/` work queue (status lives in each task file) ·
`.claude/skills.md` skill index (skills load automatically).

## "Do <ID>" (how sessions start)
"Do D1", "Do C1", "work on K3" = a task ID from `docs/tasks/`:
1. Read `docs/tasks/<ID>-*.md` in full; read only the docs in its `Read first` row.
2. Check its dependencies are merged to `main` with `npm run tasks` (task must be in **Ready next**; run on up-to-date `main`). If not, say which and stop.
3. Follow the skills it lists (always `tdd-task` and `pr-flow`) on branch `task/<ID>-<slug>`, unless a branch was assigned.
4. Finish: PR, CI green, set the task file's `Status` to `done` in that PR, merge it (or wait for approval if the task is 🔒). A merged task must never be left `in review`.

## Non-negotiables
1. **Red-green TDD** (`tdd-task`). **One task per PR**, merged into `main` through a PR (`pr-flow`).
2. **Merging:** the agent merges its own PR once CI is green. 🔒 tasks (D1, D2, J4, I4, C6, S1, S2, R1, V8, V9, V10) wait for the user's
   explicit approval in the session.
3. **Before every push, merge the latest `main` into your branch** (`git fetch origin main && git merge origin/main`),
   resolve conflicts, re-run the fast gate. Merge, don't rebase or force-push.
4. **Reuse shared modules:** timers, randomness, scoring, difficulty, text, storage, logging live in `src/core/`;
   tiles, HUD, map, results in `src/ui/`. Games add only rules and layout (boundaries: `docs/architecture.md`).
5. **Deterministic tests:** inject `Clock` and `Rng`; no `Date.now()`, `Math.random()` or real timers in tests.
   Coverage: `src/core` ≥ 95%, `src/ui` ≥ 80%; fast-check for invariants.
6. **Product rules:** no English on game boards (only a points-costing long-press hint; exceptions: the Soxta and Imlo clues, `docs/games/05-soxta.md`, `docs/games/06-imlo.md`). Uzbek shows in Latin or
   Cyrillic (player setting); other languages always in their native script (RTL for Persian/Arabic). No accounts;
   state in localStorage. Visual identity = Uzbek tilework, and the motif serves the mechanics.
7. **Text** goes only through `src/core/text` (`uzbek-text-rules`).

Fast gate: `npm run gate` (quiet: lint → typecheck → test+coverage → build; stops at first failure; `gate:changed` is inner-loop only; CI runs the individual steps) (e2e: `npm run e2e -- --trace off`).
Commits: Conventional Commits with the task ID, e.g. `feat(core/random): seeded shuffle [K2]`.

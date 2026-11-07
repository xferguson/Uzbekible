# Task index: Juft v1 and foundations

**How to use:** start a **new session** per task and say **"Do <ID>"** (e.g. "Do D1"). `CLAUDE.md` tells the
agent to open the task file, check its dependencies and follow its skills. Each task file also has a longer
*Session prompt* for when you want to spell it out. Tasks with no
unmerged dependencies can run **in parallel**. Each task's **Status** row lives in *its own task file*
(`todo → in progress → in review → done`), so parallel PRs never conflict on this index.

## P0 precondition
The PR that added `.claude/skills/`, `CLAUDE.md` and these docs must be **merged to `main`** before any task
starts, so every session loads the skills automatically.

## Gates 🔒
- **D1** general design system → user approval (`needs-approval` label) → unlocks **D2**, **D3** and **U1**
- **D2** Juft mockups → user approval → unlocks **U4** and **U5**
- **C6** content review, **S1**/**S2** spikes and **R1** release also need explicit approval.

Engine (K, E) and content (C) lanes don't wait for the design gates.

## Parallel lanes (critical path in bold)
```
A Foundation: T00 ─┬─ T01
                   └─ T02
D Core:       T00 ─┬─ K1 ── K8
                   ├─ K2 ── K3 ──┐
                   ├─ K4 ────────┼─ K10
                   ├─ K5 ── K6 ── K7
                   └─ K9
C Content:    C1 ─┬─ C2 ── C4
                  └─ C3          C5 (T00+K1) ── C6 (C2+C3)
B Design:     **D1 🔒 ── D2 🔒** ── (U4, U5)      D1 ── D3
E Juft:       E1 (C5,K7,K8,K4) · E2 (K3) · E3 (K4,E2,K10)
F UI:         U1 (D1,T00,K9) ── U2 / U3 / U5 / U6 ── U4 ── **U7 ── U8 ── R1**
```
**Start right away, in parallel:** T00, D1, C1, S1, S2. After T00: T01, T02, K1, K2, K4, K5, K9.

## Tasks
| ID | Title | Lane | Depends on |
|---|---|---|---|
| [T00](T00-app-scaffold.md) | App scaffold (Vite + React + TS, Vitest, Playwright, lint) | A Foundation | none |
| [T01](T01-pwa-deploy.md) | PWA manifest, service worker, GitHub Pages deploy | A Foundation | T00 |
| [T02](T02-quality-gates.md) | Import boundaries, coverage thresholds, fast-check | A Foundation | T00 |
| [D1](D1-design-system-mockups.md) 🔒 | General design system mockups (GATE) | B Design | none |
| [D2](D2-juft-mockups.md) 🔒 | Game 1 (Juft) screen mockups (GATE) | B Design | D1 |
| [D3](D3-pwa-icon-set.md) | Final PWA icon set | B Design | D1 |
| [C1](C1-uzbek-frequency-list.md) | Uzbek frequency lemma list (top 1000) | C Content | none |
| [C2](C2-turkish-cognates.md) | Turkish cognate & shared-loan mapping | C Content | C1 |
| [C3](C3-other-loans.md) | Russian, Persian, Arabic loan mapping | C Content | C1 |
| [C4](C4-suffixed-forms.md) | Suffixed-form pairs (evde ↔ uyda) | C Content | C2 |
| [C5](C5-content-schema-pipeline.md) | Content schema, validator, build pipeline | C Content | T00, K1 |
| [C6](C6-content-review-sheet.md) 🔒 | User review sheet for pairs | C Content | C2, C3, C5 |
| [K1](K1-core-text.md) | core/text: normalization, letters, transliteration | D Core | T00 |
| [K2](K2-core-random-clock.md) | core/random + core/clock | D Core | T00 |
| [K3](K3-core-session.md) | core/session: shared game lifecycle | D Core | K2 |
| [K4](K4-core-scoring-difficulty.md) | core/scoring + core/difficulty | D Core | T00 |
| [K5](K5-core-storage.md) | core/storage: versioned localStorage | D Core | T00 |
| [K6](K6-core-learning-log.md) | core/learning-log + export | D Core | K5 |
| [K7](K7-core-scheduler.md) | core/scheduler: which items next | D Core | K6, K2 |
| [K8](K8-core-similarity.md) | core/similarity: distance, correspondences, transparency | D Core | K1 |
| [K9](K9-core-motif-geometry.md) | core/motif: girih geometry | D Core | T00 |
| [K10](K10-core-sim.md) | core/sim: balance simulator | D Core | K3, K4, K2 |
| [E1](E1-juft-levels.md) | Juft level generator | E Juft engine | C5, K7, K8, K4 |
| [E2](E2-juft-rules.md) | Juft match rules on core/session | E Juft engine | K3 |
| [E3](E3-juft-scoring-balance.md) | Juft scoring config + balance pass | E Juft engine | K4, E2, K10 |
| [U1](U1-design-tokens-motif-ui.md) | Design tokens, fonts, motif renderers, dev gallery | F UI | D1, T00, K9 |
| [U2](U2-ui-tile-text.md) | Shared Tile, UzText/SourceText, useLongPress | F UI | U1, K1 |
| [U3](U3-ui-shell-hud.md) | HUD, Countdown, Results, GameShell + registry | F UI | U1, K3, K5, K6 |
| [U4](U4-juft-board.md) | Juft board UI | F UI | D2, U2, U3, E2 |
| [U5](U5-ui-level-map.md) | Shared LevelMap (mosaic) + level select | F UI | D2, U1, K5 |
| [U6](U6-settings.md) | Settings: languages, script, log export | F UI | U1, K5, K6 |
| [U7](U7-juft-wiring.md) | Juft end-to-end wiring | F UI | U4, U5, U6, E1, E3 |
| [U8](U8-juft-e2e.md) | Juft e2e suite | F UI | U7, T01 |
| [R1](R1-v1-release.md) 🔒 | Juft v1 release checklist | G Release | U8, D3, C6 |
| [S1](S1-spike-audio.md) 🔒 | Spike: audio sourcing | H Spikes | none |
| [S2](S2-spike-speech.md) 🔒 | Spike: Uzbek speech-to-text feasibility | H Spikes | none |

## Writing new tasks
Copy [`_TEMPLATE.md`](_TEMPLATE.md). Keep a task small enough for one PR (about ≤ 400 lines of non-generated
diff), name its dependencies, and give it a test-first plan.

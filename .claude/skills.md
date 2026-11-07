# Uzbekible agent skills: index

Claude Code loads these automatically from `.claude/skills/<name>/SKILL.md` whenever a task matches a skill's
description. This file is the human-readable index. **To add a skill:** create the folder and its `SKILL.md`
(frontmatter `name` + a trigger-oriented `description`), then add a row here, in the same PR.

| # | Skill | Use it when… | Key outputs |
|---|---|---|---|
| 1 | [`tdd-task`](skills/tdd-task/SKILL.md) | picking up any `docs/tasks/` task or making a code change | Red → green → refactor commits, evidence in PR |
| 2 | [`pr-flow`](skills/pr-flow/SKILL.md) | branching, committing, opening/labelling PRs, CI failures | Draft PR → ready → agent merges on green (🔒 tasks wait for approval) |
| 3 | [`uzbek-text-rules`](skills/uzbek-text-rules/SKILL.md) | any code/content touching Uzbek, Turkish, Russian, Persian, Arabic text | Correct normalization, letters, scripts, RTL |
| 4 | [`add-content-items`](skills/add-content-items/SKILL.md) | adding or editing vocabulary / pair data | Valid `content/items/*.yaml`, review sheet |
| 5 | [`cognate-research`](skills/cognate-research/SKILL.md) | frequency lists, cognates, borrowings, sound shifts | Cited, confidence-rated relations |
| 6 | [`design-mockup`](skills/design-mockup/SKILL.md) | design system, screen, or icon mockups | HTML mockups + Artifact + `needs-approval` PR |
| 7 | [`ui-component`](skills/ui-component/SKILL.md) | building shared components and hooks in `src/ui` | Token-only, accessible, RTL-aware, tested components |
| 8 | [`new-game-scaffold`](skills/new-game-scaffold/SKILL.md) | adding or restructuring a game | `GameDefinition` that reuses shared modules |
| 9 | [`e2e-visual-check`](skills/e2e-visual-check/SKILL.md) | Playwright tests, screenshots, offline/PWA checks | Deterministic e2e flows, screenshots |
| 10 | [`game-balance-tuning`](skills/game-balance-tuning/SKILL.md) | difficulty, scoring, timing, star thresholds | Config-only change + simulation table |

Candidates for later: `task-breakdown` (writing task files for Games 2–4), `audio-pipeline` (once spike S1
lands), `research-analysis` (analyzing exported learning logs).

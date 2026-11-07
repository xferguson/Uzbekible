# U1: Design tokens, fonts, motif renderers, dev gallery

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [D1](D1-design-system-mockups.md), [T00](T00-app-scaffold.md), [K9](K9-core-motif-geometry.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `ui-component`, `uzbek-text-rules`, `tdd-task`, `pr-flow` |
| Branch | `task/U1-design-tokens-motif-ui` |

## Goal
Lift the approved design into code.

## Acceptance criteria
- [ ] `src/design/tokens.ts` + CSS variables for light/dark from “Approved decisions” in the brief
- [ ] Self-hosted fonts covering all six scripts; font stacks keyed by `scriptMeta`
- [ ] `src/ui/motif`: `Star8`, `RosetteBand`, `PatternBg` rendering `core/motif` data
- [ ] Dev-only gallery route `/dev/gallery` listing components × states × themes

## Test-first plan
- Unit: theme switch sets `data-theme`; motif components render closed paths with accessible `aria-hidden`

## Files likely touched
- `src/design/**`
- `src/ui/motif/**`
- `src/dev/gallery/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task U1 (Design tokens, fonts, motif renderers, dev gallery). Read CLAUDE.md and docs/tasks/U1-design-tokens-motif-ui.md first, and follow the skills it lists (ui-component, uzbek-text-rules, tdd-task, pr-flow). Confirm that its dependencies (D1 and T00 and K9) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

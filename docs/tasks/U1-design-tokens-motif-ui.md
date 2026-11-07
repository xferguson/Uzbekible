# U1: Design tokens, fonts, motif renderers, dev gallery

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [D1](D1-design-system-mockups.md), [T00](T00-app-scaffold.md), [K9](K9-core-motif-geometry.md) |
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

# U2: Shared Tile, UzText/SourceText, useLongPress

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [U1](U1-design-tokens-motif-ui.md), [K1](K1-core-text.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `ui-component`, `uzbek-text-rules`, `tdd-task`, `pr-flow` |
| Branch | `task/U2-ui-tile-text` |

## Goal
The core visual unit every game uses.

## Acceptance criteria
- [ ] `Tile` states idle/selected/matched/wrong/cracked/disabled; `shape: rect|hex`; keyboard (Enter/Space); state not colour-only
- [ ] `UzText` (script setting aware) and `SourceText` (native script, lang/dir)
- [ ] `useLongPress` (touch/mouse/pen, cancel on move, configurable ms) — used for the English hint
- [ ] `Announcer` aria-live region

## Test-first plan
- Unit: each state's accessible name/description; RTL sample gets dir=rtl; long-press with fake timers fires once and not on short tap

## Files likely touched
- `src/ui/Tile/**`
- `src/ui/text/**`
- `src/ui/hooks/useLongPress.ts`
- `src/ui/Announcer/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task U2 (Shared Tile, UzText/SourceText, useLongPress). Read CLAUDE.md and docs/tasks/U2-ui-tile-text.md first, and follow the skills it lists (ui-component, uzbek-text-rules, tdd-task, pr-flow). Confirm that its dependencies (U1 and K1) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

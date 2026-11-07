# U2: Shared Tile, UzText/SourceText, useLongPress

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Depends on | [U1](U1-design-tokens-motif-ui.md), [K1](K1-core-text.md) |
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

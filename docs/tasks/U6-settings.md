# U6: Settings: languages, script, log export

| | |
|---|---|
| Status | done |
| Lane | F UI |
| Read first | `docs/design/brief.md`, `docs/architecture.md` (Shared UI), `docs/games/01-juft.md` (other docs only if needed) |
| Screens owned | `settings` |
| Depends on | [U1](U1-design-tokens-motif-ui.md), [K5](K5-core-storage.md), [K6](K6-core-learning-log.md) |
| Skills | `ui-component`, `tdd-task`, `pr-flow` |
| Branch | `task/U6-settings` |

## Goal
Player settings persisted locally.

## Acceptance criteria
- [ ] Source-language toggles tr/ru/fa/ar (≥1 must stay on)
- [ ] Uzbek script Latin/Cyrillic (Cyrillic labelled hard mode)
- [ ] Theme: system/light/dark
- [ ] Export learning log as CSV / JSON (download)
- [ ] Reset progress (with confirm)

## Test-first plan
- Unit: cannot disable the last language; settings persist via core/storage; export produces a file blob

## Files likely touched
- `src/ui/SettingsPanel/**`
- `src/shell/settings/**`

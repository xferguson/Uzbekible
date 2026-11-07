# U6: Settings: languages, script, log export

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Depends on | [U1](U1-design-tokens-motif-ui.md), [K5](K5-core-storage.md), [K6](K6-core-learning-log.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task U6 (Settings: languages, script, log export). Read CLAUDE.md and docs/tasks/U6-settings.md first, and follow the skills it lists (ui-component, tdd-task, pr-flow). Confirm that its dependencies (U1 and K5 and K6) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

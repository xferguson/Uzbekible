# C3: Russian, Persian, Arabic loan mapping

| | |
|---|---|
| Status | todo |
| Lane | C Content |
| Depends on | [C1](C1-uzbek-frequency-list.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C3-other-loans` |

## Goal
Add Russian, Persian, and Arabic partners (in native scripts) for top-1000 lemmas that have them.

## Acceptance criteria
- [ ] `sources[lang=ru|fa|ar]` added with native script text (Cyrillic, Perso-Arabic, Arabic)
- [ ] Relation, confidence, ref for each
- [ ] PR summary: counts per language and relation

## Test-first plan
- `npm run content:validate` passes (once C5 merged)

## Files likely touched
- `content/items/**`

## Notes
Can run in parallel with C2; coordinate on files by splitting YAML per frequency band to avoid conflicts.

## Session prompt (copy-paste)
```
Work on Uzbekible task C3 (Russian, Persian, Arabic loan mapping). Read CLAUDE.md and docs/tasks/C3-other-loans.md first, and follow the skills it lists (cognate-research, add-content-items, uzbek-text-rules, pr-flow). Confirm that its dependencies (C1) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

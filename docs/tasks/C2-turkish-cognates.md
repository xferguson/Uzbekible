# C2: Turkish cognate & shared-loan mapping

| | |
|---|---|
| Status | done |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C1](C1-uzbek-frequency-list.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C2-turkish-cognates` |

## Goal
For every top-1000 lemma, find Turkish partners (Turkic cognates, shared Arabic/Persian loans) with confidence and sound-shift tags.

## Acceptance criteria
- [ ] `content/items/freq-*.yaml` items with `sources[lang=tr]` where a partner exists
- [ ] Each source: relation, confidence, correspondence tags, ref
- [ ] False friends recorded with `relation: false-friend`
- [ ] PR summary: coverage of top 100/200/500/1000, counts by relation and confidence, list of low-confidence items

## Test-first plan
- `npm run content:validate` passes (once C5 merged; otherwise YAML lint)

## Files likely touched
- `content/items/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task C2 (Turkish cognate & shared-loan mapping). Read CLAUDE.md and docs/tasks/C2-turkish-cognates.md first, and follow the skills it lists (cognate-research, add-content-items, uzbek-text-rules, pr-flow). Confirm that its dependencies (C1) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

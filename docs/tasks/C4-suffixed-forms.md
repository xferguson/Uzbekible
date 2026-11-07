# C4: Suffixed-form pairs (evde ↔ uyda)

| | |
|---|---|
| Status | todo |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [C2](C2-turkish-cognates.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C4-suffixed-forms` |

## Goal
Create inflected Uzbek↔Turkish pairs for Juft levels 31+.

## Acceptance criteria
- [ ] ≥150 `form: inflected` items over the top-200 lemmas covering plural, possessive 1sg/2sg, locative, dative, ablative, past -di, present-continuous
- [ ] Each has `lemma`, `suffixes`, and an inflected Turkish source
- [ ] Tag pairs where suffixes diverge (-yap- vs -iyor-) as `divergent-suffix`

## Test-first plan
- `npm run content:validate` passes

## Files likely touched
- `content/items/inflected-*.yaml`

## Session prompt (copy-paste)
```
Work on Uzbekible task C4 (Suffixed-form pairs (evde ↔ uyda)). Read CLAUDE.md and docs/tasks/C4-suffixed-forms.md first, and follow the skills it lists (cognate-research, add-content-items, uzbek-text-rules, pr-flow). Confirm that its dependencies (C2) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

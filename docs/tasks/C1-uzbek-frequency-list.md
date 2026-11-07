# C1: Uzbek frequency lemma list (top 1000)

| | |
|---|---|
| Status | in review |
| Lane | C Content |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `cognate-research`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C1-uzbek-frequency-list` |

## Goal
Produce a cited, lemmatized top-1000 Uzbek frequency list.

## Acceptance criteria
- [x] `content/sources/SOURCES.md` lists every corpus/list used with URL, license, retrieval date, method
- [x] `content/sources/uz-freq-top1000.csv`: rank, lemma (canonical Latin with U+02BB), cyrl, pos, count, source
- [x] Method note: how surface forms were lemmatized, how lists were merged
- [x] Spot-check of 30 random rows documented in the PR

## Test-first plan
- If a script is written: unit tests for its normalization/merging (uses `core/text` if merged)

## Files likely touched
- `content/sources/**`

## Notes
Content research may require network hosts not yet allowed; if blocked, report which host is needed.

## Session prompt (copy-paste)
```
Work on Uzbekible task C1 (Uzbek frequency lemma list (top 1000)). Read CLAUDE.md and docs/tasks/C1-uzbek-frequency-list.md first, and follow the skills it lists (cognate-research, add-content-items, uzbek-text-rules, pr-flow). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

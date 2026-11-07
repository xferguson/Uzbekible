# K8: core/similarity: distance, correspondences, transparency

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K1](K1-core-text.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `cognate-research`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/K8-core-similarity` |

## Goal
Measure how transparent a pair is (drives difficulty) and support fuzzy matching (Wordfall).

## Acceptance criteria
- [ ] `distance(a,b)` (Damerau-Levenshtein over `toLetters`)
- [ ] `rules.ts`: Turkish→Uzbek correspondence rules from the `cognate-research` skill as data (id, pattern, replacement, context)
- [ ] `applyRules(tr)` → candidate Uzbek forms; `transparency(tr, uz)` ∈ [0,1]
- [ ] `bestMatch(input, candidates, threshold)`

## Test-first plan
- Property: distance symmetric, 0 iff equal (after normalize), triangle inequality; transparency in [0,1]
- Unit: göz→koʻz, gelmek→kelmoq, kara→qora score high; ev→uy scores low

## Files likely touched
- `src/core/similarity/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task K8 (core/similarity: distance, correspondences, transparency). Read CLAUDE.md and docs/tasks/K8-core-similarity.md first, and follow the skills it lists (tdd-task, cognate-research, uzbek-text-rules, pr-flow). Confirm that its dependencies (K1) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

# K8: core/similarity: distance, correspondences, transparency

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [K1](K1-core-text.md) |
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

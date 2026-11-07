# C1: Uzbek frequency lemma list (top 1000)

| | |
|---|---|
| Status | done |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | none |
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

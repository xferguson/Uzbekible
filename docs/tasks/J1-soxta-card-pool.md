# J1: Soxta card pool from false-friend data

| | |
|---|---|
| Status | todo |
| Lane | J Soxta |
| Depends on | [C5](C5-content-schema-pipeline.md) |
| Read first | `docs/games/05-soxta.md` ("Content needs"), `docs/technical-design.md` (content schema) |
| API used | `docs/api.md` § `core/content` (`Item`, `boardPool`) |
| Skills | `tdd-task`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/J1-soxta-card-pool` |

## Goal
A pure `soxtaPool(items)` that turns existing `relation: false-friend` entries into swipe cards, reusing the data
under C6 review. No new research. Adds an optional English gloss on false-friend sources for the Turkish side.

## Acceptance criteria
- [ ] `Card` = `{ id, uz: Item, other: { lang, text }, clues: { uz: string, other?: string }, tier }`
- [ ] Only items with a Turkish false-friend source and a non-empty `glossEn`; deprecated items excluded
- [ ] Optional `glossEn` on a source is validated if present (schema + validator); absent means Uzbek-side clues only
- [ ] Complementary to `boardPool`: no item is in both pools
- [ ] Partial false friends (flagged in the source `ref` or a new `partial` flag) are excluded from v1

## Test-first plan
- Red: `soxtaPool` on a fixture with one false friend and one cognate returns exactly the false friend
- Property: for any items, `soxtaPool(items)` and `boardPool(items)` are disjoint

## Files likely touched
- `src/games/soxta/cards.ts`, `src/core/content/schema.ts` (+ validate), tests

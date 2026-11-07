# E2: Juft match rules on core/session

| | |
|---|---|
| Status | done |
| Lane | E Juft engine |
| Read first | `docs/games/01-juft.md`, `docs/architecture.md` (rows you use) (other docs only if needed) |
| Depends on | [K3](K3-core-session.md) |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/E2-juft-rules` |

## Goal
Pure rules reducer for selecting and matching tiles.

## Acceptance criteria
- [ ] Actions: `select(side, tileId)`, `hint(tileId)`; events: `selected`, `deselected`, `matched`, `mismatched`, `hintShown`, `complete`, `lifeLost`
- [ ] Same-tile tap deselects; same-column tap moves selection; cross-column pair evaluates
- [ ] Mismatch → `lifeLost`; all pairs matched → `complete`; combo counter tracked
- [ ] Shuffle of columns on level start via `core/random`

## Test-first plan
- Property: matched tiles never re-selectable; number of matched pairs ≤ pairs; complete iff all matched
- Unit: 3 mismatches → session `lost` (integration with K3)

## Files likely touched
- `src/games/juft/rules.ts`

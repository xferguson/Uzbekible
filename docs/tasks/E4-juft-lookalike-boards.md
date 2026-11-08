# E4: Juft look-alike and suffix-family boards

| | |
|---|---|
| Status | done |
| Lane | E Juft engine |
| Depends on | [E1](E1-juft-levels.md) |
| Read first | `docs/games/01-juft.md` ("Level progression", "Board focus") |
| Screens owned | none |
| API used | `core/similarity`, `core/random` |
| Skills | `tdd-task`, `game-balance-tuning`, `pr-flow` |
| Branch | `claude/juft-game-difficulty-pairs-bmcel3` |

## Goal
Juft boards were too easy to read: tiles rarely looked alike, so a pair could be found by glancing. Add two board
kinds that make the player read closely: **look-alike** boards (words spelled alike) and **suffix-family** boards (one
stem with many suffixes, matched to the right suffixed forms).

## Acceptance criteria
- [x] `focusFor(level)` in `difficulty.config.ts`: `mixed` in chapter 1, `lookalike` every 3rd level from 16, `family` every 4th level from 61 (family wins a clash); hard-pair breathers stay `mixed`
- [x] `JuftParams.focus` carries it; no UI change (the board looks the same, only the words differ)
- [x] Look-alike boards: lemmas only, the tightest of 12 random seeds plus nearest neighbours by `core/similarity` distance over the Uzbek and source spelling
- [x] Family boards: a stem's own item plus its suffixed forms (from the `lemma` link in the content), then the next stem if the board is bigger; falls back to the normal draw when Turkish (the only suffixed source) is off
- [x] Every existing invariant holds (distinct tiles, determinism, enabled languages only, 12-pair cap)

## Test-first plan
- Red: `levels.test.ts` "juft focus schedule" asserts `focusFor` (did not exist)
- Mean Uzbek-form distance on look-alike boards is lower than on mixed boards; a family board has ≥ 5 pairs of one stem
- Property tests in `levels.property.test.ts` still pass for all levels 1–160

## Files likely touched
- `src/games/juft/difficulty.config.ts`, `levels.ts`, `levels.test.ts`, `docs/games/01-juft.md`

## Notes for next tasks
- Tuning is by schedule constants only (`LOOKALIKE_*`, `FAMILY_*`). Run `game-balance-tuning` before moving them far: tighter boards cost more mistakes, so par and star thresholds may need a pass.
- The suffix-family idea is also a fit for Qoʻsh (Compose).

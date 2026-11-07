# I3: Imlo spelling rules on core/session

| | |
|---|---|
| Status | on hold: awaiting approval of the Imlo plan (`docs/games/06-imlo.md`) |
| Lane | I Imlo |
| Depends on | [I2](I2-imlo-levels.md) |
| Read first | `docs/games/06-imlo.md` ("Core loop", "Rules"), `src/games/juft/rules.ts` (shape to mirror) |
| API used | `docs/api.md` § `core/session`, `core/scoring` |
| Skills | `tdd-task`, `new-game-scaffold`, `pr-flow` |
| Branch | `task/I3-imlo-rules` |

## Goal
Pure rules for one level: active side, placing and removing tiles, check, hint, lives, advancing through pairs.

## Acceptance criteria
- [ ] Actions: `selectSide(side)`, `place(tileId)`, `remove(side, slot)`, `check()`, `hint(side, slot)`; events from the shared vocabulary (Q5) plus `spellCorrect`, `spellWrong {side, given, expected}`, `hintUsed`, `lifeLost`
- [ ] `place` fills the first empty slot of the active side; when that side fills, the other side becomes active if it has gaps
- [ ] `remove` returns the tile to the bank and leaves the slot empty; hinted slots are locked
- [ ] `check` is a no-op until both sides are full; it compares letter values, not tile ids; wrong reports each wrong side and costs one life in total
- [ ] `hint` takes a matching tile from the bank, or from a slot where it is misplaced, and locks it
- [ ] Level complete after the last pair; failed at 0 lives

## Test-first plan
- Red: `src/games/imlo/rules.test.ts`: spelling *isim* and *ism* then `check` emits `spellCorrect` and moves to pair 2
- Property: for any action sequence, every bank tile is in exactly one place (bank or one slot); lives never below 0

## Files likely touched
- `src/games/imlo/rules.ts`, tests

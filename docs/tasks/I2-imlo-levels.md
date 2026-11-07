# I2: Imlo level generator and letter bank

| | |
|---|---|
| Status | done |
| Lane | I Imlo |
| Depends on | [I1](I1-core-text-source-letters.md), [I5](I5-game-modes.md) |
| Read first | `docs/games/06-imlo.md` ("Difficulty modes", "Level progression"), `src/games/juft/levels.ts` (`chooseSource`, `band`) |
| API used | `docs/api.md` § `core/content` (`boardPool`), `core/text`, `core/random`, `core/difficulty`, `core/scheduler` |
| Skills | `tdd-task`, `new-game-scaffold`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/I2-imlo-levels` |

## Goal
`createImloLevels(items)` returns `levels(ctx)`: for a level, mode and settings, the pairs to spell and each
pair's shuffled letter bank, deterministically.

## Acceptance criteria
- [ ] `ImloPair` = `{ itemId, clue, source: { lang, text, letters }, uz: { text, letters }, bank: BankTile[] }`; `BankTile` = `{ id, letter, origin: 'source' | 'uz' | 'distractor' }`
- [ ] Pool: `boardPool`, enabled languages, one source per item (share Juft's `chooseSource` by moving it to a shared games helper, not copying it); excludes multi-word/hyphenated, > 8 letters, and pairs identical in the shown scripts
- [ ] Uzbek letters in the player's script (`toLetters`); source letters via `sourceLetters`
- [ ] Pair count, letter range and distractor count from `difficulty.config.ts` curves (`core/difficulty`)
- [ ] Qiyin: distractors from the confusables table in config, correspondence counterparts first; never one that forms another valid spelling of either word
- [ ] Missed items resurface via `core/scheduler`; same context, same `LevelSpec`

## Test-first plan
- Red: `src/games/imlo/levels.test.ts`: a fixture with *ism* ↔ *isim* gives a bank whose letters are the multiset `i i i s s m m` in Oson
- Property: for any level and mode, bank letters = source letters + Uzbek letters + distractors (as multisets); Oson/Oʻrta have no distractors

## Files likely touched
- `src/games/imlo/levels.ts`, `src/games/imlo/difficulty.config.ts`, `src/games/imlo/confusables.ts`, `src/games/shared/source.ts`, tests

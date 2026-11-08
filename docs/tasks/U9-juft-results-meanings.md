# U9: Juft results: show the words and their meanings

| | |
|---|---|
| Status | todo |
| Lane | F UI |
| Depends on | [V10](V10-juft-results-overlays-board.md) |
| Read first | `docs/games/01-juft.md` ("Approved decisions" 13), `docs/design/brief.md` |
| Screens owned | none (adds to the results frame V10 owns; needs a mockup update and user approval first) |
| API used | none |
| Skills | `tdd-task`, `ui-component`, `design-fidelity-review`, `pr-flow` |
| Branch | `task/U9-juft-results-meanings` |

## Goal
**Parked at the user's request: record now, build later.** After clearing a level, the results screen lists the words
just played with their meanings, so the round teaches as well as scores.

## Open questions (decide when this is picked up)
- English gloss (`glossEn`) is the only meaning in the content. The product rule keeps English off *boards*; the results screen is not a board, but confirm.
- Does the list show all pairs, only the ones missed, or both (missed first)?
- Fits V10's results layout at 12 pairs on 360 px without scrolling? May need a collapsible list.

## Acceptance criteria
- [ ] Mockup for the list approved by the user (🔒 for this part)
- [ ] Results show each pair: source word, Uzbek word in the player's script, meaning
- [ ] Persian/Arabic rows RTL; Uzbek in the chosen script; no new storage
- [ ] Matches the mockup at 360/390/1280, light and dark, comparison in the PR

## Test-first plan
- Red: `Results` test renders the level's pairs with their glosses

## Files likely touched
- `src/ui/` results component, `src/games/juft/` results data, `docs/games/01-juft.md`

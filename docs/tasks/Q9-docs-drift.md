# Q9: Fix docs drift in technical design and architecture

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/technical-design.md`, `docs/architecture.md` (other docs only if needed) |
| Depends on | none |
| Skills | `pr-flow` |
| Branch | `task/Q9-docs-drift` |

## Goal
Bring the engineering docs back in line with what is built, so new sessions don't build to stale facts.

## Acceptance criteria
- [ ] Tech design: React 19 (not 18); learning-log cap 5,000 (or the agreed number); a note that content/sim scripts run core under Node `--experimental-strip-types`, hence explicit `.ts` imports; coverage rule (index files counted)
- [ ] Architecture: `morphology` marked deferred to Game 2 (Juft uses curated inflected content); `audio`/`speech` interfaces marked deferred with S1 instead of "exist from the start"
- [ ] No code changes (docs-only PR)

## Test-first plan
- Red: n/a (docs-only); the docs CI link check passes

## Files likely touched
- `docs/technical-design.md`
- `docs/architecture.md`

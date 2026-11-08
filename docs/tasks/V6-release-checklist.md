# V6: Release checklist: visual QA and a real-device play-through

| | |
|---|---|
| Status | done |
| Lane | V Visual quality |
| Depends on | none |
| Read first | `docs/tasks/R1-v1-release.md`, `docs/PRD.md` §7 (other docs only if needed) |
| API used | none |
| Skills | `pr-flow` |
| Branch | `task/V6-release-checklist` |

## Goal
Make the release gate look at the product, not only at metrics. R1 passed on Lighthouse and e2e while the screens were visibly broken.

## Acceptance criteria
- [x] `docs/tasks/_RELEASE_TEMPLATE.md` for future R tasks: the latest `shots/compare.html` published and reviewed; `npm run e2e:layout` full matrix green; the design-reviewer run with no blocker or major open; a play-through by the user on a real Android phone (360-class) and an iPhone, light and dark, every screen, recorded in the task file; Lighthouse and e2e kept as before
- [x] The release PR's Screenshots section links the compare page (no n/a)
- [x] `docs/tasks/README.md` → Writing new tasks mentions the release template
- [x] Docs-only PR

## Test-first plan
- Red: n/a (docs-only)

## Files likely touched
- `docs/tasks/_RELEASE_TEMPLATE.md`
- `docs/tasks/README.md`

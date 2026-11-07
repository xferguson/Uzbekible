# K9: core/motif: girih geometry

| | |
|---|---|
| Status | todo |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/K9-core-motif-geometry` |

## Goal
Pure maths for star polygons, rosettes and tilings so all visuals (and the icon) share one geometry.

## Acceptance criteria
- [ ] `starPolygon(n, k, r, rInner?)` → closed point list; `rosette(n, ...)`; `tilePattern(kind, bounds)`
- [ ] Output is plain data (points/paths) — SVG rendering lives in `src/ui/motif`

## Test-first plan
- Property: n-fold rotational symmetry (rotate by 2π/n maps point set to itself within ε); paths closed; points within radius

## Files likely touched
- `src/core/motif/**`

## Session prompt (copy-paste)
```
Work on Uzbekible task K9 (core/motif: girih geometry). Read CLAUDE.md and docs/tasks/K9-core-motif-geometry.md first, and follow the skills it lists (tdd-task, pr-flow). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

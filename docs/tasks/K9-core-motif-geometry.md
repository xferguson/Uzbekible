# K9: core/motif: girih geometry

| | |
|---|---|
| Status | done |
| Lane | D Core |
| Read first | `docs/architecture.md` (your module's row) (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md) |
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

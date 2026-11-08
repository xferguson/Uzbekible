# J3: ui/useSwipe gesture hook

| | |
|---|---|
| Status | todo |
| Lane | J Soxta |
| Depends on | [U1](U1-design-tokens-motif-ui.md) |
| Read first | `.claude/skills/ui-component/SKILL.md` (a11y, reduced motion), `docs/architecture.md` (`src/ui` row) |
| API used | none |
| Skills | `tdd-task`, `ui-component`, `pr-flow` |
| Branch | `task/J3-ui-use-swipe` |

## Goal
A reusable pointer-gesture hook: horizontal swipe with a distance and velocity threshold, tap-on-side and arrow-key
fallbacks, live drag offset for animation, and reduced-motion support.

## Acceptance criteria
- [ ] Returns `{ bind, offsetX, direction }`; fires `onSwipe('left' | 'right')` once per gesture
- [ ] Below-threshold release snaps back with no callback; vertical-dominant drags are ignored
- [ ] Arrow keys and tapping a side fire the same callback; works for mouse, touch and pen
- [ ] Respects `prefers-reduced-motion` (no animated offset)
- [ ] Coverage ≥ 80% for `src/ui`

## Test-first plan
- Red: pointerdown, move +120px, up fires `onSwipe('right')` once
- Property: any drag with |dx| < threshold never fires

## Files likely touched
- `src/ui/useSwipe.ts`, `src/ui/useSwipe.test.tsx`

---
name: ui-component
description: Use when building shared React components or hooks in src/ui/: tokens-only styling, a11y, RTL, reduced motion, tests.
---

# Shared UI component recipe

Shared UI lives in `src/ui/`. Games compose these; they do not fork them. If a game needs a variant, add a
prop/variant to the shared component (with tests) instead of copying it.

## Structure
```
src/ui/<Component>/
  <Component>.tsx
  <Component>.module.css     # tokens only: var(--color-*), var(--space-*), var(--radius-*)
  <Component>.test.tsx
  index.ts
```
Register a demo in the dev gallery route (`src/dev/gallery/`) showing every variant × state × theme.

## Rules
1. **Tokens only.** No raw hex colours, px font sizes, or ad-hoc shadows. Tokens come from `src/design/tokens`.
2. **Logic stays in `src/core`.** Components receive state and emit events; no scoring/timer/shuffle logic
   inside components. Hooks may adapt core modules to React (`useSession(session)`).
3. **Text** goes through `<UzText>` / `<SourceText>` (sets `lang`, `dir`, font). See `uzbek-text-rules`.
4. **RTL**: logical CSS properties only (`inline-start`, `block-end`). Test with an Arabic-script sample.
5. **Accessibility**
   - Semantic element or correct `role`; accessible name via visible text or `aria-label`.
   - Keyboard: every pointer action has a keyboard path (Tile: Enter/Space selects; arrow keys move).
   - `:focus-visible` style from tokens.
   - State not by colour alone (Tile `wrong` shows crack lines; `matched` shows star outline).
   - Announce game events via a shared polite `aria-live` region (`<Announcer>`), not ad-hoc.
6. **Motion**: wrap animations with `useReducedMotion()`; provide a non-motion alternative (fade/instant).
7. **Pointer**: use shared hooks (`useLongPress`, `usePathSelect`) — they handle touch, mouse, pen,
   cancellation, and are already tested.

## Tests (Testing Library + Vitest)
- Render each state; assert via `getByRole`/`getByLabelText`.
- Interactions with `user-event` (click, keyboard, long-press using fake timers).
- RTL sample renders with `dir="rtl"`.
- Reduced motion: mock `matchMedia` and assert no animation class.
- Coverage for `src/ui` ≥ 80%.

## Checklist
- [ ] Tokens only · [ ] logic in core · [ ] lang/dir via shared text components
- [ ] keyboard + focus-visible · [ ] not colour-only · [ ] reduced motion
- [ ] gallery entry · [ ] tests green

- [ ] `npm run shots` pairs match the owned frames at 360/390/1280, light and dark; design-fidelity review (V5) has no open blocker or major

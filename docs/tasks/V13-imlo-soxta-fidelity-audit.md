# V13: Imlo and Soxta design-fidelity audit, with follow-up tasks

| | |
|---|---|
| Status | todo |
| Lane | V Visual quality |
| Depends on | [V5](V5-design-review-skill.md), [I7](I7-imlo-wiring-e2e.md), [J6](J6-soxta-wiring-e2e.md) |
| Read first | `.claude/skills/design-fidelity-review/SKILL.md`, `docs/design/fidelity-juft.md` (the format and the V8–V10 owner split to reuse), `docs/design/frames.json` (the `imlo-*` and `soxta-*` entries), I4 and J4 frames in `docs/design/mockups/screens/` (`I4-*`, `J4-*`) |
| Screens owned | none |
| API used | none |
| Skills | `design-fidelity-review`, `task-breakdown`, `pr-flow` |
| Branch | `task/V13-imlo-soxta-fidelity-audit` |

## Goal
V7 audited Juft against D2, and V8–V10 fix it. Imlo (I4) and Soxta (J4) shipped since then and have had no full
audit. J6's reviews found gaps that sit outside its own scope, for example the shared light screen bar, the full-sheet
pause overlay used by Juft and Imlo, text-glyph icons and the missing desktop frames. Produce the complete, owned list
of what still differs from the approved mockups for those two games and the shared parts they use. Then turn it into
fix tasks, so making the app match the design is a queue of small PRs rather than a vague goal.

## Acceptance criteria
- [ ] `npm run shots -- --games imlo,soxta` (plus `home` and `settings`) on up-to-date `main`; compare page published as
      an Artifact and linked from both docs
- [ ] The independent `design-reviewer` grades every `imlo-*` and `soxta-*` state at 360, 390 and 1280, light and dark.
      The implementing agent doesn't grade its own work.
- [ ] `docs/design/fidelity-imlo.md` and `docs/design/fidelity-soxta.md` contain one mismatch table per state (frame,
      what differs, severity, owner), in the `fidelity-juft.md` format, and say which states still have no frame
- [ ] Each gap has exactly one owner:
  - shell gaps (app frame, screen bar, home, settings, ready card, countdown, pause, results) go to an existing
    V8/V9/V10 task, whose acceptance criteria are widened to cover Imlo and Soxta where they don't already
  - game gaps go to a new task in the game's lane (I or J), written with `task-breakdown` (≤ 400 lines, one screen
    each, a named first red test, `Screens owned` set)
- [ ] A short **Follow-ups** section at the top of each doc, ordered by severity (blockers, then majors), linking the
      owning tasks; minors may be grouped into one polish task per game
- [ ] Missing frames (for example `soxta-countdown`, the desktop `soxta-results`, and Imlo states with `[]`) are listed
      as design work for the user, not invented
- [ ] Docs and task files only; no app changes. `npm run tasks -- check` passes; README table and lane diagram updated
      for any new task

## Test-first plan
- Red: n/a (audit). Validated by `npm run tasks -- check` (new tasks have valid ids, links and no cycles) and
  `npm run tasks -- frames` (any state a new task claims is owned exactly once)

## Files likely touched
- `docs/design/fidelity-imlo.md`, `docs/design/fidelity-soxta.md`
- `docs/tasks/I*-*.md`, `docs/tasks/J*-*.md` (new fix tasks), `docs/tasks/V8-*.md`, `V9-*.md`, `V10-*.md` (scope)
- `docs/tasks/README.md`

## Notes for next tasks
Already known from J6's two `design-reviewer` rounds (PR #90). Start the tables from these, but re-grade everything.
- Shell: the ready card uses the light `ScreenBar`, not the navy app bar with a rosette band and a gear button (V8's
  page frame). The full-sheet `PauseOverlay` (Juft, Imlo) has a nearly invisible title over navy. Buttons use text
  glyphs (↻ ⌂ ▶) instead of the mockup's SVG icons. Button labels are Uzbek where the mockups write English; that is
  a decision for the user, record it.
- Soxta: no visible board behind the pause card. No desktop keyboard-focus ring state. The `+N` score delta chip in
  the HUD isn't drawn. Results lack a desktop frame.

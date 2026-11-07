## Summary
<!-- What changed and why, in 1–3 sentences. -->

## Task
<!-- e.g. K1 — docs/tasks/K1-core-text.md. "none" for ad-hoc docs. -->

## Red → Green evidence
<!-- Paste the failing test output (red) and the passing output (green). "n/a" for docs/design-only. -->

## Docs-only?
- [ ] Yes. Only `docs/**`, `.claude/**` or `*.md` changed (fast CI path)

## Screenshots / Artifact link
<!-- UI and design changes: phone + desktop, light + dark. -->

## Checklist
- [ ] Tests written first; `npm run lint && npm run typecheck && npm test -- --coverage && npm run build` pass locally
- [ ] Reused shared `src/core` / `src/ui` modules (no duplicated timers, shuffles, scoring, text logic)
- [ ] No English on game boards; scripts and RTL handled through shared text components
- [ ] Task file `Status` row updated
- [ ] Labelled `needs-approval` if this needs the user's sign-off (design, product, content review)

## Summary
<!-- What changed and why, in 1–3 sentences. -->

## Task
<!-- e.g. K1 — docs/tasks/K1-core-text.md. "none" for ad-hoc docs. -->

## Red → Green evidence
<!-- Red: failing test names + summary line (e.g. `Tests 3 failed | 41 passed`). Green: summary line. "n/a" for docs/design-only. -->

## Docs-only?
- [ ] Yes. Only `docs/**`, `.claude/**` or `*.md` changed (fast CI path)

## Screenshots / Artifact link
<!-- CI (pr-evidence) fails a PR that touches src/ui/**, src/shell/**, src/games/*/**/*.tsx or any *.css unless this
section links a mockup comparison: run `npm run shots`, publish compare.html as an Artifact and paste the link
(or name `shots/compare`). Phone + desktop, light + dark.
Release (R) PR: always link the published compare page; "n/a" is not allowed (docs/tasks/_RELEASE_TEMPLATE.md).
Non-visual UI change (e.g. a hook refactor)? Write `Visual change: none (<one-line reason>)` instead. "n/a" fails. -->

## Checklist
- [ ] Tests written first; `npm run gate` passes locally
- [ ] Reused shared `src/core` / `src/ui` modules (no duplicated timers, shuffles, scoring, text logic)
- [ ] No English on game boards; scripts and RTL handled through shared text components
- [ ] Task file `Status` row updated
- [ ] Labelled `needs-approval` if this needs the user's sign-off (design, product, content review)

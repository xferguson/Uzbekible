# D1: General design system mockups (GATE)

| | |
|---|---|
| Status | in review |
| Lane | B Design |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `design-mockup`, `pr-flow`, `uzbek-text-rules` |
| Branch | `task/D1-design-system-mockups` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Produce the Uzbekible visual identity for user approval: palette, type, motif library, tile states, 3 icon concepts, sample home screen.

## Acceptance criteria
- [ ] Self-contained HTML mockup(s) in `docs/design/mockups/D1-*.html`, published as an Artifact (link in PR)
- [ ] Palette swatches light + dark using token names from `docs/design/brief.md` §3, with contrast ratios listed for every text/background pair
- [ ] Type specimen showing Uzbek Latin (incl. oʻ gʻ ʼ), Uzbek Cyrillic (ў қ ғ ҳ), Turkish (ğ ı İ ş), Russian, Persian (RTL), Arabic (RTL)
- [ ] Motif library: 8-point girih star, rosette band, subtle background pattern; tile in all states (idle, selected, matched-star, wrong-crack, disabled, focus)
- [ ] Three PWA icon concepts per brief §6, shown at 512, 192, 48 px and in a maskable safe-zone overlay
- [ ] Sample home screen (phone 390×844 + desktop) light + dark
- [ ] Screenshots (deviceScaleFactor 2) committed under `docs/design/mockups/screens/`
- [ ] PR labelled `needs-approval`; on approval, “Approved decisions” in the brief is filled in within the same PR

## Test-first plan
- n/a (design task) — run a contrast check script or manual table

## Files likely touched
- `docs/design/mockups/**`
- `docs/design/brief.md`

## Session prompt (copy-paste)
```
Work on Uzbekible task D1 (General design system mockups (GATE)). Read CLAUDE.md and docs/tasks/D1-design-system-mockups.md first, and follow the skills it lists (design-mockup, pr-flow, uzbek-text-rules). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

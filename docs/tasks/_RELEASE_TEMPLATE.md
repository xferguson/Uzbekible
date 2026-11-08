# <ID>: <Product> release checklist

Copy this for every R task (release). It extends [`_TEMPLATE.md`](_TEMPLATE.md). R1 passed on Lighthouse and e2e
while screens were visibly broken, so the gate below looks at the product, not only at metrics.

| | |
|---|---|
| Status | todo |
| Lane | G Release |
| Depends on | <task links, including every V-lane task the release needs> |
| Read first | `docs/PRD.md` §7 (other docs only if needed) |
| Screens owned | none |
| API used | none |
| Skills | `e2e-visual-check`, `design-fidelity-review`, `pr-flow` |
| Branch | `task/<ID>-<slug>` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Ship <product> <version>.

## Acceptance criteria
Every box needs evidence in **Release evidence** below. A box without evidence is not ticked.

### Visual
- [ ] `npm run shots` run on the release commit; `shots/compare.html` published as an Artifact and reviewed (360, 390, 1280; light and dark)
- [ ] `npm run e2e:layout` full matrix green (no viewport/theme skipped)
- [ ] `design-reviewer` run on the shots; **no blocker or major open** (minors listed with follow-up task IDs)
- [ ] Real-device play-through by the user, **every screen**, **light and dark**, recorded in Release evidence:
  - [ ] Android phone, 360-class width
  - [ ] iPhone (Safari, and installed to the home screen)

### Metrics (unchanged from R1)
- [ ] Lighthouse mobile: PWA installable, a11y ≥95, performance ≥90
- [ ] `npm run e2e -- --trace off` green, including offline
- [ ] Content review approved; final icons in manifest
- [ ] Deployed site URL in README; version tag created on the merge commit after approval
- [ ] PRD status updated

## Test-first plan
- n/a

## Files likely touched
- `README.md`
- `docs/PRD.md`

## Release evidence
Fill in before asking for approval.

- **Commit:** <sha>
- **Compare page:** <Artifact link to `shots/compare.html`> (also pasted in the PR's Screenshots section; "n/a" is not allowed for a release PR)
- **Layout matrix:** <`npm run e2e:layout` summary line>
- **Design review:** <mismatch table summary: blockers 0, majors 0, minors N → task IDs>
- **Lighthouse:** <version, profile, scores>
- **e2e:** <summary line>

### Real-device play-through
Played by the user. One row per screen (list every frame from `docs/design/frames.json`); mark ✅ or write the defect.

| Screen | Android 360 light | Android 360 dark | iPhone light | iPhone dark |
|---|---|---|---|---|
| <state id> | | | | |

- **Devices / OS / browser:** <e.g. Pixel 7, Android 15, Chrome; iPhone 14, iOS 18, Safari>
- **Played by / date:** <name, date>
- **Defects found:** <none, or list with fix task IDs; any visible defect blocks the release>

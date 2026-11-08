# V7: Juft design-fidelity audit against D2

| | |
|---|---|
| Status | done |
| Lane | V Visual quality |
| Depends on | [V1](V1-shots-script.md), [V5](V5-design-review-skill.md) |
| Read first | `docs/tasks/D2-juft-mockups.md`, all D2 frames in `docs/design/mockups/screens/` (other docs only if needed) |
| API used | none |
| Skills | `design-fidelity-review`, `pr-flow` |
| Branch | `task/V7-juft-fidelity-audit` |

## Goal
List every gap between the shipped Juft screens and the approved D2 mockups, so the fix tasks (V8–V10) start from a complete, prioritised list rather than one bug report. PR #65 fixed the overflow but says the screens still don't match D2.

## Acceptance criteria
- [x] `docs/design/fidelity-juft.md`: a mismatch table per frame (from the design-reviewer), with severity and the V8/V9/V10 task that owns it
- [x] The compare page published as an Artifact and linked from the doc
- [x] The acceptance criteria of V8–V10 updated if the audit finds work outside them (or a new V task added via `task-breakdown`)
- [x] Docs-only PR; no app changes

## Test-first plan
- Red: n/a (audit)

## Files likely touched
- `docs/design/fidelity-juft.md`
- `docs/tasks/V8-*.md`, `V9-*.md`, `V10-*.md` (scope updates only)

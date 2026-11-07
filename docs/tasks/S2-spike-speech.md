# S2: Spike: Uzbek speech-to-text feasibility

| | |
|---|---|
| Status | todo |
| Lane | H Spikes |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `pr-flow`, `e2e-visual-check` |
| Branch | `task/S2-spike-speech` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Find out whether Wordfall can recognize spoken Uzbek reliably enough.

## Acceptance criteria
- [ ] Test Web Speech API `uz-UZ` (Chrome desktop/Android, Safari iOS), one cloud STT, and one on-device option (Whisper wasm or Vosk) against 30 words
- [ ] Measure accuracy, latency, offline support, privacy
- [ ] Evaluate constrained-vocabulary matching via `core/similarity`
- [ ] Recommendation doc `docs/spikes/S2-speech.md`; PR `needs-approval`

## Test-first plan
- n/a

## Files likely touched
- `docs/spikes/S2-speech.md`

## Session prompt (copy-paste)
```
Work on Uzbekible task S2 (Spike: Uzbek speech-to-text feasibility). Read CLAUDE.md and docs/tasks/S2-spike-speech.md first, and follow the skills it lists (pr-flow, e2e-visual-check). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

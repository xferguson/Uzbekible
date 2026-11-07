# S2: Spike: Uzbek speech-to-text feasibility

| | |
|---|---|
| Status | todo |
| Lane | H Spikes |
| Read first | `docs/technical-design.md` §7 (other docs only if needed) |
| Depends on | none |
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

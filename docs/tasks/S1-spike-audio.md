# S1: Spike: audio sourcing

| | |
|---|---|
| Status | on hold: audio deferred, see [docs/spikes/S1-audio.md](../spikes/S1-audio.md) |
| Lane | H Spikes |
| Read first | `docs/technical-design.md` §7 (other docs only if needed) |
| Depends on | none |
| Skills | `cognate-research`, `pr-flow` |
| Branch | `task/S1-spike-audio` |

> **Approval gate:** don't merge until the user explicitly approves in the session. Label the PR `needs-approval`.

## Goal
Decide how Uzbek audio will be sourced for Games 3/4 (and Juft later).

## Acceptance criteria
- [ ] Compare options in `docs/technical-design.md` §7 on: coverage of top-1000, quality (sample 20 words), license, cost, offline size
- [ ] Prototype: generate/download 10 sample words, publish an Artifact page to listen
- [ ] Recommendation doc `docs/spikes/S1-audio.md`; PR `needs-approval`

## Test-first plan
- n/a

## Files likely touched
- `docs/spikes/S1-audio.md`

## Notes
Needs network access to TTS/recording sources; may need an API key via the credential flow.

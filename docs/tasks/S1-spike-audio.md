# S1: Spike: audio sourcing

| | |
|---|---|
| Status | todo |
| Lane | H Spikes |
| Depends on | none |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
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

## Session prompt (copy-paste)
```
Work on Uzbekible task S1 (Spike: audio sourcing). Read CLAUDE.md and docs/tasks/S1-spike-audio.md first, and follow the skills it lists (cognate-research, pr-flow). Confirm that its dependencies (none) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

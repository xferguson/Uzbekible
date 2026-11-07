# C5: Content schema, validator, build pipeline

| | |
|---|---|
| Status | todo |
| Lane | C Content |
| Read first | `docs/technical-design.md` §3–4 (other docs only if needed) |
| Depends on | [T00](T00-app-scaffold.md), [K1](K1-core-text.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `add-content-items`, `uzbek-text-rules`, `pr-flow` |
| Branch | `task/C5-content-schema-pipeline` |

## Goal
Implement `core/content` (zod schema, types, loader, validator) and the `content:*` CLI.

## Acceptance criteria
- [ ] `ItemSchema` per `docs/technical-design.md` §3; TS types derived from it
- [ ] Validator checks: schema, unique ids, both Uzbek scripts present, Cyrillic matches transliteration or is flagged, canonical apostrophes, native script per source language, no false-friend in board pools
- [ ] `content:build` emits `public/content/items.v1.json` (deterministic ordering) and computes `transparency` via `core/similarity` when K8 is merged (else omitted)
- [ ] `content:review` writes `docs/content/review.md` grouped by confidence
- [ ] Seed fixture of ~20 items (pronouns, numbers, examples from PRD) so downstream tasks can work before C2/C3

## Test-first plan
- Red: invalid fixtures (missing cyrl, wrong script for ru, duplicate id) each produce a specific error
- Property: build output is stable (same input → byte-identical JSON)

## Files likely touched
- `src/core/content/**`
- `content/scripts/**`
- `content/items/seed.yaml`

## Session prompt (copy-paste)
```
Work on Uzbekible task C5 (Content schema, validator, build pipeline). Read CLAUDE.md and docs/tasks/C5-content-schema-pipeline.md first, and follow the skills it lists (tdd-task, add-content-items, uzbek-text-rules, pr-flow). Confirm that its dependencies (T00 and K1) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```

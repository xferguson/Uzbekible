---
name: pr-flow
description: Use whenever committing, pushing, opening, updating, labelling, or merging a pull request in Uzbekible, or when CI fails on a PR. Encodes branch naming, the PR template, labels, and the auto-merge policy.
---

# Pull request flow (Uzbekible)

## Policy (enforced by `.github/workflows/automerge.yml`)
- **Everything goes through a PR into `main`.** Never push directly to `main`.
- CI (`.github/workflows/ci.yml`) runs on every PR.
  - **Docs-only PRs** (only `docs/**`, `.claude/**`, `*.md`) take the fast path and pass quickly.
  - Code PRs run lint → typecheck → unit tests + coverage → build → e2e.
- When CI succeeds, automerge **squash-merges** the PR, **unless** it is:
  - a draft, or
  - labelled `needs-approval` (design/product gates — the user merges or removes the label), or
  - labelled `do-not-merge`.

## Steps
1. Branch: `task/<ID>-<slug>` (or the branch the session was assigned).
2. Commits: Conventional Commits with the task ID, e.g. `feat(core/text): fold apostrophe variants [K1]`.
3. Push: `git push -u origin <branch>` (retry on network errors with 2s/4s/8s/16s backoff).
4. Open the PR **as a draft**, filling `.github/pull_request_template.md` sections:
   Summary · Task · Red → Green evidence · Docs-only? · Screenshots · Checklist.
5. Labels:
   - Design mockups, PRD/product decisions → `needs-approval`.
   - Content data changes → `content`.
   - Anything risky you want the user to see first → `do-not-merge`.
6. When the work is complete and the local fast gate passes, **mark the PR ready for review**. That is the
   signal for auto-merge once CI is green.
7. Subscribe to PR activity and fix CI failures yourself: reproduce locally first, fix minimally, push.

## CI red?
- Read the failing job log. Reproduce with the same npm script locally.
- Fix the cause. Never skip/disable tests, never lower thresholds, never push empty commits to re-trigger.

## After merge
- Set the task file's `Status` row to `done` (in the PR itself, before merge, is preferred).
- If the next task in the lane is unblocked, mention it to the user.

## Caveat
Merges made by the automerge workflow use `GITHUB_TOKEN`, which does **not** trigger `push` workflows.
So after merging, the automerge job dispatches `deploy.yml` with `workflow_dispatch`, which `GITHUB_TOKEN` *is* allowed
to trigger (see `docs/technical-design.md` §9).

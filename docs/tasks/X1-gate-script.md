# X1: One quiet fast-gate command: `npm run gate`

| | |
|---|---|
| Status | todo |
| Lane | X Harness |
| Read first | `CLAUDE.md` (Fast gate), `.claude/skills/tdd-task/SKILL.md` §5 (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/X1-gate-script` |

## Goal
Replace the four chained gate commands with one script whose output is short enough to read in full: failures, the coverage summary, and a final verdict. Agents currently pull hundreds of lines of lint, test and build output into context on every gate run.

## Acceptance criteria
- [ ] `scripts/gate.mjs` runs lint → typecheck → `vitest run --coverage` → build in order, stops at the first failing step, and exits non-zero
- [ ] Quiet output: vitest `dot` reporter + `text-summary` coverage, eslint `--format compact`, build output suppressed unless it fails; a passing run prints ≤ 15 lines ending in `GATE OK`
- [ ] A failing step prints only that step's error lines (file:line + message), capped at ~60 lines, with a hint to re-run the single step for full output
- [ ] `npm run gate` and `npm run gate:changed` (vitest `--changed origin/main`, for the inner loop only; not a substitute for the full gate) in `package.json`
- [ ] CI `app` job is unchanged (it keeps calling the individual steps, so its logs stay complete)

## Test-first plan
- Red: Unit test (`scripts/gate.test.ts`) with an injected step runner: a failing typecheck step stops the run, later steps are not called, exit code 1, output contains the step name; all-passing prints `GATE OK`

## Files likely touched
- `scripts/gate.mjs`, `scripts/gate.test.ts`
- `package.json`

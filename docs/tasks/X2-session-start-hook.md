# X2: SessionStart hook: warm sessions with deps, fresh main and a task board

| | |
|---|---|
| Status | todo |
| Lane | X Harness |
| Read first | `.claude/skills/pr-flow/SKILL.md` (Steps), `playwright.config.ts` (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow`, `update-config`, `session-start-hook` |
| Branch | `task/X2-session-start-hook` |

## Goal
Every cloud session starts with no `node_modules` and a stale `origin/main`, and spends its first turns on `npm ci`, fetches and orientation. A committed SessionStart hook does this once, deterministically, before the agent starts.

## Acceptance criteria
- [ ] `.claude/settings.json` registers a `SessionStart` hook running `scripts/session-start.sh`
- [ ] The script runs `npm ci` only when `node_modules` is missing or the `package-lock.json` hash differs from a stamp file in `node_modules/`, then `git fetch -q origin main` (network errors are non-fatal)
- [ ] Exports `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` when that path exists (via `$CLAUDE_ENV_FILE` if available)
- [ ] Prints ≤ 20 lines: branch, whether `origin/main` is merged into HEAD, and (if `scripts/tasks.mjs` from X3 exists) the ready-next task list
- [ ] Idempotent and completes in < 5 s when nothing changed; exits 0 even if a step fails (a warning line instead)

## Test-first plan
- Red: Shell test (`scripts/session-start.test.ts`, spawns the script in a temp copy with a fake `npm`): second run with an unchanged lockfile does not call `npm ci`; changing the lockfile does

## Files likely touched
- `.claude/settings.json`, `scripts/session-start.sh`, `scripts/session-start.test.ts`

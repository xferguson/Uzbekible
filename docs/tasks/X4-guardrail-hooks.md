# X4: Guardrail hooks and a permission allowlist

| | |
|---|---|
| Status | todo |
| Lane | X Harness |
| Read first | `CLAUDE.md` (Non-negotiables), `.claude/skills/pr-flow/SKILL.md` (other docs only if needed) |
| Depends on | [X2](X2-session-start-hook.md), [Q4](Q4-enforce-gates.md) |
| Skills | `tdd-task`, `pr-flow`, `update-config` |
| Branch | `task/X4-guardrail-hooks` |

## Goal
Enforce the prose non-negotiables with cheap, deterministic Claude Code hooks, so agents get an immediate one-line refusal instead of a failed CI run or a review round. Q4 covers lint/CI-side rules; this covers agent actions.

## Acceptance criteria
- [ ] `PreToolUse` (Bash) hook `scripts/hooks/guard-bash.mjs` blocks with a one-line reason: `git push --force`/`-f`/`--force-with-lease`, `git rebase`, `git push` to `main`, and `git push` when `origin/main` is not an ancestor of HEAD ("run `git fetch origin main && git merge origin/main` first")
- [ ] `PreToolUse` (Edit/Write) hook `scripts/hooks/guard-edit.mjs` blocks: edits to `package-lock.json`; new `.only(`/`.skip(` in test files; lowering any number in `vite.config.ts` coverage `thresholds`
- [ ] `PostToolUse` (Edit/Write) runs `prettier --write` on the edited file (silent on success)
- [ ] `permissions.allow` in `.claude/settings.json` for `npm run *`, `npx vitest*`, `npx playwright*`, and read-only git (`status`, `log`, `diff`, `show`, `fetch`, `branch`)
- [ ] Hooks exit fast (< 200 ms) and never print on the allowed path

## Test-first plan
- Red: Unit tests (`scripts/hooks/*.test.ts`) feed hook JSON on stdin: `git push --force origin x` → exit 2 with reason; `git push -u origin task/X4-y` with main merged → exit 0; an Edit adding `it.only(` → blocked

## Files likely touched
- `.claude/settings.json`, `scripts/hooks/guard-bash.mjs`, `scripts/hooks/guard-edit.mjs`, tests

## Note
Merge after Q4 so the PostToolUse Prettier hook never reformats unrelated lines in already-unformatted files.

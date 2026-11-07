# X7: Cheap helper subagents: gate-runner and ci-triage

| | |
|---|---|
| Status | todo |
| Lane | X Harness |
| Read first | `.claude/skills/pr-flow/SKILL.md` (CI red?) (other docs only if needed) |
| Depends on | [X1](X1-gate-script.md) |
| Skills | `pr-flow` |
| Branch | `task/X7-helper-subagents` |

## Goal
Keep large logs out of the main agent's context and do the mechanical reading on a cheaper model.

## Acceptance criteria
- [ ] `.claude/agents/gate-runner.md` (model `haiku`, tools: Bash, Read): runs `npm run gate` (or a given step) and replies with only `GATE OK` or the failing step plus ≤ 20 lines of file:line errors
- [ ] `.claude/agents/ci-triage.md` (model `haiku`, tools: GitHub actions/job-log tools, Read, Grep): given a PR number, finds the failing job, returns the root-cause excerpt (≤ 30 lines), the failing step and the local repro command
- [ ] `pr-flow` "CI red?" and `tdd-task` §5 say when to delegate to them (and when not: a few lines of output aren't worth a spawn)
- [ ] `.claude/skills.md` index gains an "Agents" table
- [ ] Manually verified once each in the PR (paste the agent's reply on a deliberately broken commit)

## Test-first plan
- Red: n/a (agent definitions); evidence is one run of each agent against a deliberately failing branch, shown in the PR body

## Files likely touched
- `.claude/agents/gate-runner.md`, `.claude/agents/ci-triage.md`
- `.claude/skills/pr-flow/SKILL.md`, `.claude/skills/tdd-task/SKILL.md`, `.claude/skills.md`

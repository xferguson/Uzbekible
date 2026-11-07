# V5: `design-fidelity-review` skill + independent `design-reviewer` subagent

| | |
|---|---|
| Status | done |
| Lane | V Visual quality |
| Depends on | [V1](V1-shots-script.md) |
| Read first | `.claude/skills/design-mockup/SKILL.md`, `docs/design/brief.md`, `.claude/agents/*.md` (for the format) (other docs only if needed) |
| API used | none |
| Skills | `pr-flow` |
| Branch | `task/V5-design-review-skill` |

## Goal
Stop agents from grading their own visual work. A reviewer that did not write the code compares app and mockup screenshots against a fixed checklist and returns the mismatches.

## Acceptance criteria
- [x] `.claude/skills/design-fidelity-review/SKILL.md`: run `npm run shots`, open each pair, go through the checklist (page frame and header, motif band, type tokens and sizes, spacing, colours, every state shown, overflow and clipping, dark mode, 360 px), and write a mismatch table into the PR (frame · what differs · severity: blocker/major/minor)
- [x] `.claude/agents/design-reviewer.md` (tools: Read, Bash) takes the `shots/` folder and the frame map and returns only the mismatch table; the implementing agent must run it and may not merge with a blocker or major left open
- [x] Indexed in `.claude/skills.md`
- [x] A dry run against the v1.0.0 map and results screens finds the known gaps (header and tile band, building icons, tower facade, card overflow); paste the table into the PR as evidence

## Test-first plan
- Red: n/a (skill and agent text); the dry run against v1.0.0 is the check

## Files likely touched
- `.claude/skills/design-fidelity-review/SKILL.md`
- `.claude/agents/design-reviewer.md`
- `.claude/skills.md`

# X6: Generated API digest: `docs/api.md`

| | |
|---|---|
| Status | done |
| Lane | X Harness |
| Read first | `docs/architecture.md` (Shared core modules, Shared UI) (other docs only if needed) |
| Depends on | none |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/X6-api-digest` |

## Goal
The U and E tasks still to come will each open many `src/core/*/index.ts` files just to learn real signatures, because the architecture table only sketches them. Generate one compact, always-current digest instead.

## Acceptance criteria
- [ ] `scripts/api-digest.mjs` uses the TypeScript compiler API to list, for each `src/core/<module>` and `src/ui` entry point, every exported function/type/const with its signature and the first line of its JSDoc
- [ ] Output `docs/api.md`: one `##` per module, one line per export, sorted, no implementation code; target < 25 KB
- [ ] `npm run api` writes it; `npm run api -- --check` exits 1 if the committed file is stale; CI `app` job runs the check
- [ ] `docs/architecture.md` "Key exports (sketch)" column header links to `docs/api.md` as the source of truth; CLAUDE.md "Where things are" lists it
- [ ] `tdd-task` adds: when you change a module's exports, run `npm run api`

## Test-first plan
- Red: Unit test (`scripts/api-digest.test.ts`) on a fixture module: exported `function f(a: number): string` with JSDoc `/** Does x. */` renders as ``- `f(a: number): string` - Does x.``; a non-exported helper is absent

## Files likely touched
- `scripts/api-digest.mjs`, `scripts/api-digest.test.ts`, `package.json`
- `docs/api.md` (generated), `docs/architecture.md`, `CLAUDE.md`
- `.github/workflows/ci.yml`, `.claude/skills/tdd-task/SKILL.md`

## Note
Q5, Q7 and Q8 change exports; whichever merges after X6 just re-runs `npm run api`.

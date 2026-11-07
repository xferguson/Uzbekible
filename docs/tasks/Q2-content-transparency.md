# Q2: Wire transparency scores into the content build

| | |
|---|---|
| Status | todo |
| Lane | Q Quality |
| Read first | `docs/technical-design.md` §3, `docs/architecture.md` (`similarity`, `content` rows) (other docs only if needed) |
| Depends on | [Q1](Q1-node-runnable-core.md) |
| Skills | `tdd-task`, `pr-flow` |
| Branch | `task/Q2-content-transparency` |

## Goal
Put `core/similarity` transparency scores into `public/content/items.v1.json` (currently 0 items have one), so E1 can use transparency as a difficulty knob, and stop the committed pack from drifting from `content/items/`.

## Acceptance criteria
- [ ] `itemTransparency(item): Partial<Record<Lang, number>>` in `src/core/content/` (or `similarity`): for `tr` sources, best `transparency(source.text, item.uz.latn)` over the item's Turkish sources; other languages omitted (documented in the function comment and the tech design)
- [ ] `content/scripts/cli.ts` imports it directly; the stale "once K8 is merged" shim and its cast are gone
- [ ] `public/content/items.v1.json` rebuilt; every item with a Turkish source has `transparency.tr` in [0, 1]
- [ ] CI step: `npm run content:build && git diff --exit-code public/content` (pack must be up to date)

## Test-first plan
- Red: Unit: `itemTransparency(makeItem())` returns `{ tr: 1 }` for göz↔koʻz and `{}` for an item with only a Russian source
- Property: values always in [0, 1]; only languages present in `sources` appear

## Files likely touched
- `src/core/content/transparency.ts` (+ tests)
- `content/scripts/cli.ts`
- `public/content/items.v1.json` (generated)
- `.github/workflows/ci.yml`

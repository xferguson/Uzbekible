# Uzbekible: architecture and shared modules

The point of this map: **write each hard idea once, test it hard, and import it everywhere.** Most bugs in a
project like this live in text handling, randomness and time, and game state, so those are shared modules with
the strictest tests.

## Layers and import rules (enforced by `eslint-plugin-boundaries`)
```
shell  ──►  games/*  ──►  ui  ──►  design
  │            │          │
  └────────────┴──────────┴──►  core   (core imports nothing outside core)
```
- `core` imports only `core` (no React, no DOM except adapters behind interfaces).
- `design` imports nothing from the app. `ui` imports `core` and `design`, never `games` or `shell`.
- `games/<a>` never imports `games/<b>`. Games import `core`, `ui`, `design`, and `games/types`.
- `content/scripts` imports `core` only (shared schema and text rules).

## Shared core modules
| Module | Responsibility | Key exports (sketch; source of truth: [`docs/api.md`](api.md)) | Tests | Used by |
|---|---|---|---|---|
| `text` | NFC, apostrophe folding, Turkish case, Uzbek letters, Latin↔Cyrillic, `scriptMeta` | `normalize`, `foldApostrophes`, `toLowerTr`, `toLetters`, `latnToCyrl`, `cyrlToLatn`, `scriptMeta` | unit + **property** (round-trip, idempotence) | all games, content, ui |
| `random` | seeded RNG, shuffle, sample, weighted pick, seed from string | `createRng(seed)`, `shuffle`, `sample`, `weightedPick`, `seedFrom` | **property** (permutation, determinism) | all games, sim |
| `clock` | injectable time and a frame loop; fake clock | `Clock`, `systemClock`, `createFakeClock`, `frameLoop` | unit | session, Wordfall |
| `session` | generic lifecycle, lives, timer, events; hosts a game rules reducer | `createSession(rules, opts)` | unit + **property** (lives never < 0, terminal states absorbing) | all games |
| `scoring` | time decay vs. par, penalties, hints, combos, stars, multipliers | `score(result, config)`, `stars(...)` | **property** (monotonic, ≥ 0) | all games |
| `difficulty` | level → parameters via curves (linear, step, logistic) + explicit special levels | `paramsFor(level, config)` | **property** (non-decreasing except declared) | all games |
| `scheduler` | next items: frequency order + re-showing missed items + mastery estimate | `nextItems(pool, history, n, rng)` | unit + property | all games |
| `similarity` | edit distance, Turkish→Uzbek correspondence rules, transparency score, fuzzy match | `distance`, `applyRules`, `transparency`, `bestMatch` | unit + property (symmetry, bounds) | content build, Juft difficulty, Wordfall |
| `morphology` *(deferred to Game 2; Juft uses curated inflected content)* | suffix allomorphs and attachment, form validation | `attach(root, suffixes)`, `isValid` | unit | Game 2 suffix levels, Qoʻsh |
| `storage` | namespaced, versioned localStorage, migrations, memory fallback | `createStore(ns, schema, migrations)` | unit + **property** (migrate → validates) | shell, all games |
| `content` | zod schema, types, loader, validator | `ItemSchema`, `loadItems`, `validateItems` | unit | app, content scripts |
| `learning-log` | append attempt events, aggregates, CSV/JSON export | `log(event)`, `exportCsv`, `aggregates` | unit | all games, settings |
| `motif` | girih and rosette geometry (star polygons {n/k}, tilings) as pure point data | `starPolygon`, `rosette`, `tilePattern` | **property** (symmetry, closed paths) | ui/motif, icon |
| `audio`, `speech` *(deferred with S1; not built yet)* | provider interfaces + fakes | `AudioProvider`, `SpeechRecognizer`, `createFake*` | unit | Eshit, Wordfall, (Juft later) |
| `sim` | headless bot runner for balance | `simulate(def, profiles, levels, seed)` | unit | balance tuning |
| `grid` (later) | word-search placement | `placeWords` | property | Eshit |

## Shared UI (`src/ui`)
| Component / hook | Notes | Used by |
|---|---|---|
| `Tile` | states idle/selected/matched/wrong/cracked/disabled; `shape: rect \| hex`; keyboard | all games |
| `UzText`, `SourceText` | `lang`, `dir`, font stack, script toggle | everywhere text appears |
| `motif/*` | SVG renderers over `core/motif` (`Star8`, `RosetteBand`, `PatternBg`) | all screens, icon |
| HUD: `Timer`, `Lives`, `Score`, `LevelBadge`, `Combo` | | all games |
| `Countdown`, `PauseOverlay`, `ResultsScreen` | | all games via GameShell |
| `LevelMap` | mosaic facade; progress from storage | all games |
| `SettingsPanel` | source-language toggles, Uzbek script, log export | shell |
| `Announcer` | shared `aria-live` region | all games |
| `useLongPress`, `usePathSelect`, `useReducedMotion`, `useSession` | pointer and keyboard abstractions | Juft (hint), Qoʻsh/Eshit (paths) |
| `GameShell` (in `shell/`) | hosts a `GameDefinition` | all games |

## Shared processes
| Process | Single source |
|---|---|
| Task work | `tdd-task` skill + `docs/tasks/_TEMPLATE.md` |
| PRs and merging | `pr-flow` skill + `.github/workflows/*` |
| Content | `content/scripts` pipeline + `add-content-items` / `cognate-research` skills |
| Design | `design-mockup` skill + `docs/design/brief.md` + the `needs-approval` gate |
| New game | `new-game-scaffold` skill |
| Balance | `core/sim` + `game-balance-tuning` skill |

## Quality gates (enforced in CI)
- **Boundaries:** `eslint.config.js` encodes the rules above with `eslint-plugin-boundaries`; `scripts/lint-boundaries.test.ts` proves a bad import is reported. A new top-level folder or game must be classified there.
- **Accessibility:** `eslint-plugin-jsx-a11y` (recommended) runs on all `.tsx`.
- **Coverage:** `vite.config.ts` thresholds fail `npm test -- --coverage` below 95% lines and branches for `src/core/**` and 80% for `src/ui/**`. Never lower them.
- **Property tests:** invariants go in `<module>.property.test.ts` next to the unit test, using `fast-check` with a fixed `seed` (see `src/core/_example/`).

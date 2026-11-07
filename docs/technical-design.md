# Uzbekible: technical design

**Status:** v0.1 · Companion docs: [`architecture.md`](architecture.md), [`PRD.md`](PRD.md)

## 1. Stack
| Concern | Choice | Why |
|---|---|---|
| Build | **Vite** | Fast dev server, simple static output for GitHub Pages |
| UI | **React 18 + TypeScript (strict)** | Widely known by agents and humans; good testing ecosystem |
| Styling | CSS Modules + CSS custom properties (tokens) | No runtime cost; themeable; tokens shared with mockups |
| Unit tests | **Vitest** + Testing Library + `@testing-library/user-event` | Fast, Vite-native |
| Property tests | **fast-check** | Invariants for core maths and text |
| E2E | **Playwright** (phone + desktop projects) | Pre-installed in cloud sessions |
| Schema | **zod** | One schema → TS types + runtime validation (app and content scripts) |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest, precache, offline |
| Lint / format | ESLint (typescript-eslint, `eslint-plugin-boundaries`, jsx-a11y) + Prettier | Enforced import boundaries + accessibility |
| Hosting | **GitHub Pages** via Actions | Free, static, HTTPS (required for PWA and the mic later) |

Node: the current LTS, pinned in `.nvmrc`. Package manager: npm (lockfile committed).

## 2. Repository layout
```
src/
  core/            # pure TS: no React, no DOM (except storage/audio adapters behind interfaces)
    text/ random/ clock/ session/ scoring/ difficulty/ scheduler/ similarity/
    morphology/ storage/ content/ learning-log/ motif/ audio/ speech/ sim/
  design/          # tokens.ts, fonts, global.css, theme
  ui/              # shared React components and hooks
  games/
    types.ts       # GameDefinition contract
    registry.ts
    juft/          # Game 1
  shell/           # App, routing, home, settings, level map host, GameShell
  dev/gallery/     # component gallery route (dev builds only)
content/
  sources/         # raw inputs + SOURCES.md
  items/           # curated YAML
  scripts/         # pipeline CLI
public/
  content/         # generated JSON (build output of content pipeline)
  icons/
e2e/
docs/
```

## 3. Content model
Defined once in `src/core/content/schema.ts` (zod). Sketch:
```ts
type Lang = 'tr' | 'ru' | 'fa' | 'ar';
type Relation = 'turkic-cognate' | 'shared-arabic' | 'shared-persian' | 'russian-loan'
              | 'persian-loan' | 'arabic-loan' | 'false-friend';
interface SourceForm { lang: Lang; text: string; relation: Relation;
  confidence: 'high'|'medium'|'low'; correspondence?: string[]; ref: string }
interface Item { id: string; uz: { latn: string; cyrl: string }; freqRank: number;
  form: 'lemma'|'inflected'; lemma?: string; suffixes?: string[]; pos?: string;
  glossEn: string; sources: SourceForm[]; tags: string[]; deprecated?: boolean;
  transparency?: Partial<Record<Lang, number>> }   // computed at build by core/similarity
```
Pipeline (`npm run content:*`): **fetch → normalize → enrich (transparency, transliteration check) → validate →
review sheet (`docs/content/review.md`) → build (`public/content/items.v1.json`)**. The app loads the JSON
lazily and the service worker precaches it.

## 4. Scripts and text
All in `core/text` (see the `uzbek-text-rules` skill):
- NFC normalization and canonical apostrophes (U+02BB / U+02BC)
- Turkish-aware case folding
- the Uzbek letter tokenizer (digraphs as single letters)
- Latin↔Cyrillic transliteration
- `scriptMeta(lang)` giving `dir`, `lang` tag and font stack

Stored Cyrillic is authoritative; the converter generates and checks it. Persian and Arabic are RTL, laid out with
CSS logical properties.

## 5. Game architecture
- `core/session`: a generic lifecycle state machine `ready → countdown → playing ⇄ paused → won | lost`, with
  `lives`, an elapsed time from the injected `Clock`, and an event stream. Games supply a **rules reducer**
  (`(state, action) → state + events`) that runs inside the session.
- `GameDefinition` (see the `new-game-scaffold` skill) plugs a game into the `GameShell`. The shell handles the
  countdown, HUD, pause, results, persistence, logging and settings.
- Determinism: an injectable `Rng` (seeded, mulberry32 or sfc32) and `Clock`. Test builds read `?seed=` and
  `?clock=fake`, and expose `window.__uzbekibleTest` for e2e.
- **Simulation:** `core/sim` runs a game's rules headlessly with bot profiles to tune balance (see the
  `game-balance-tuning` skill).

## 6. Persistence (localStorage)
- `core/storage` wraps `localStorage` in try/catch, with an in-memory fallback (private mode, quota).
- Keys are namespaced: `uzbekible:v<schema>:<namespace>`, where the namespace is `settings`, `progress:<gameId>` or `log`.
- Every namespace has a zod schema and a **migration chain** (`v1 → v2 → …`), covered by property tests
  (a migrated value always validates).
- Learning log: append-only, capped (e.g. 50k events, oldest first rolled into per-item aggregates), exportable
  as CSV/JSON from Settings.

## 7. Audio and speech plan (not built for v1)
> **Audio is on hold** (2026-11-07). See [S1 spike note](spikes/S1-audio.md) for what was learned and where to restart.

Interfaces exist from the start so games can depend on them:
```ts
interface AudioProvider { preload(ids: string[]): Promise<void>; speak(id: string): Promise<void> }
interface SpeechRecognizer { start(vocab: string[]): AsyncIterable<{ text: string; confidence: number }>; stop(): void }
```
Options, evaluated in spike **S1** (audio) and **S2** (speech-to-text):
1. **Pre-generated neural TTS** with native uz-UZ voices (e.g. Azure *uz-UZ-MadinaNeural* / *SardorNeural*;
   check current availability). Generated at content-build time with a key held only in CI or locally, committed
   as Opus/MP3, and precached by the service worker. Consistent and offline-friendly.
2. **Openly licensed human recordings** (Wikimedia Commons, Lingua Libre, Wiktionary audio). Authentic, but
   patchy coverage, and each recording needs licence attribution.
3. **Our own recordings** with native speakers. The best quality, but costly.
4. **Device Web Speech synthesis**: browsers rarely ship an Uzbek voice. Fallback only.

Speech-to-text options for Wordfall: the Web Speech API (`uz-UZ`, online and browser-dependent), cloud STT, an
on-device Whisper (wasm/WebGPU) or Vosk, or keyword spotting restricted to the on-screen vocabulary.

## 8. PWA
`vite-plugin-pwa` handles:
- the manifest (name "Uzbekible", theme colour cobalt, background glaze white, maskable icons from D3);
- precaching the app shell, fonts and content JSON;
- the `autoUpdate` strategy, with a "new version available" toast.

The site lives under the repo path on GitHub Pages: Vite `base: '/Uzbekible/'`.

## 9. CI/CD
| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | `pull_request`, `push` to `main` | **changes** job detects docs-only (`docs/**`, `.claude/**`, `**/*.md`). Docs-only → fast pass. Otherwise lint, typecheck, unit + coverage, build, e2e. Code jobs skip themselves until `package.json` exists. |
| `deploy.yml` (task T01) | `push` to `main` + `workflow_dispatch` | Build and deploy to GitHub Pages |

**Merging:** there's no auto-merge workflow. Agents merge their own PRs through the GitHub tools once CI is green
(approval-gated tasks wait for the user). See the `pr-flow` skill. Those merges are made with the user's
credentials, so `push` to `main` triggers CI and deploy normally.
**Repo settings needed:** Pages → Source: GitHub Actions (for T01). The labels `needs-approval`, `do-not-merge`, `content` are optional signals.

## 10. Quality gates
- Coverage thresholds (Vitest): `src/core/**` ≥ 95% lines and branches; `src/ui/**` ≥ 80%.
- fast-check property tests required for: text and transliteration, random and shuffle, scoring, difficulty,
  storage migrations, motif geometry, and (later) grid placement.
- ESLint boundaries (see `architecture.md`), plus jsx-a11y.
- Deferred: visual regression, mutation testing.

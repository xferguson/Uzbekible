# S1 spike: Uzbek audio sourcing

| | |
|---|---|
| Task | [S1](../tasks/S1-spike-audio.md) |
| Date | 2026-11-07 |
| Status | Recommendation, waiting for user approval |
| Listen page | https://claude.ai/artifact/9WkMcLH3r8Fq4pjrUVvPt9 (source: [`S1-audio/listen.html`](S1-audio/listen.html), built from `S1-audio/generate-espeak.sh`) |

## Question
How should Uzbekible source Uzbek word audio for Games 3 and 4 (and Juft later), given the options in
[technical-design §7](../technical-design.md#7-audio-and-speech-plan-not-built-for-v1)?

## Recommendation
1. **Primary: pre-generated Azure neural TTS** (`uz-UZ-MadinaNeural`, with `uz-UZ-SardorNeural` as a second
   voice). Generate at `content:build` time with a key held only locally or in CI, and commit
   **Ogg Opus, mono, 24 kbps** with an **MP3 32 kbps** fallback. The service worker precaches the files,
   one file per item ID: `public/audio/uz/<voice>/<itemId>.opus`.
2. **Overrides: openly licensed human recordings** (Lingua Libre / Wikimedia Commons) where they exist for an
   item, after a listening check, with attribution in a generated credits screen. These are a quality upgrade,
   not a coverage source.
3. **Dev and CI placeholder: espeak-ng** (`-v uz`). It runs offline, with no key, and covers every word, so the
   audio pipeline, the manifest and `AudioProvider` can be built and tested before any key exists.
   It never ships to players.
4. **Not now:** our own recordings (best quality, but cost and logistics; revisit for v2 if the Azure voices
   fail the native-speaker check). Device Web Speech synthesis is used only at runtime, when a `uz` voice
   reports itself, and only for items that have no file.

**The gate before audio work starts:** a 20-word Azure sample and a native-speaker listening check (see
[Blocked](#what-this-spike-could-not-verify)). If Azure fails that check, fall back to option 3 in
technical-design §7 (own recordings) for the top 200 words.

## Comparison

Legend: ✅ measured in this spike · 📄 from vendor documentation, not verified here · ❓ estimate or unknown

| Option | Top-1000 coverage | Quality | Licence | Cost | Offline size (1000 words) |
|---|---|---|---|---|---|
| **Azure neural TTS** (uz-UZ Madina/Sardor) | 100% (any text) | 📄 Neural, natural prosody; quality on single isolated words not yet heard | 📄 Output usable in apps under Microsoft product terms; confirm the terms for prebuilt neural voices | 📄 About 7k characters for 1000 lemmas, inside the free tier (0.5M characters a month); even paid, under $1 | ❓ About 3 MB Opus per voice (≈0.9 s per word at 24 kbps); MP3 fallback +35% |
| **Meta MMS-TTS** (`facebook/mms-tts-uzb-script_cyrillic`) | 100% (Cyrillic input) | 📄 VITS, one voice, intelligible but uneven | 📄 **CC BY-NC 4.0**: non-commercial only | Free, runs locally or in CI | ❓ Same as above |
| **Uzbek commercial TTS APIs** (local providers) | ❓ 100% | ❓ Not assessed | ❓ Per-vendor contract | ❓ | ❓ |
| **Google Cloud TTS / Amazon Polly** | 📄 Uzbek not listed when last checked; re-check | — | — | — | — |
| **Lingua Libre / Wikimedia Commons** human recordings | ❓ Patchy: likely well under 50% of the top 1000, few speakers | 📄 Authentic; recording level and noise vary per file | 📄 Mostly CC BY-SA 4.0: per-file attribution, share-alike on the audio | Free | ❓ Larger, unless re-encoded to the same Opus profile |
| **Own recordings** with native speakers | 100% (what we record) | Best, controlled | Ours (needs a signed release from the speaker) | ❓ About $200–800 for 1000 words (2–4 h of speaker time plus editing) | Same as TTS after encoding |
| **espeak-ng** (`uz` voice, v1.51) | ✅ 100% | ✅ Formant synthesis: robotic, wrong stress (see below) | GPL-3 engine; the generated audio is ours | ✅ Free, offline | ✅ **35 KB for 20 words** (1.75 KB per word Opus, 2.4 KB MP3); about 1.8 MB for 1000 |
| **Web Speech API** (device voices) | ❓ Very low: most browsers ship no `uz` voice | Varies per device | n/a | Free | 0 |

## Prototype: espeak-ng, 20 words ✅
I generated 20 high-frequency words (18 lemmas plus 2 infinitives, covering oʻ, gʻ, ʼ, q, x, sh, ch) with
`espeak-ng -v uz -s 140`, trimmed the silence and encoded them with ffmpeg as Opus 24 kbps and MP3 32 kbps.
The listen page plays all 20.

Results (IPA from `espeak-ng --ipa`):

| Finding | Example | Impact |
|---|---|---|
| Latin input: letters map correctly, including oʻ [o] vs o [ɑ], gʻ [ʁ], q [q], x [χ] | `togʻ → tˈɑʁ`, `koʻz → kˈoz` | Good |
| **Stress on the first syllable.** Uzbek stress is usually final | `salom → sˈæɫɑm` (should be saˈlom) | Every polysyllable sounds wrong to a native ear |
| `i` is always [ɨ], even where Uzbek has [i] | `kitob → kˈytɑb` | Audible accent |
| **Cyrillic input is mis-read**: я → [dʒ], ш → [s] | `яхши → dʒˈæχsy`, `шаҳар → sˈæhæɾ` | Feed Latin only |
| **U+02BC ʼ breaks the word**: espeak spells the letters out and reads the symbol's name | `maʼno → "em a (adjective) en o"` | Map ʼ to ASCII `'` before synthesis; `ma'no → mˈæʔnɑ` |

Conclusion: espeak-ng is fine as a pipeline placeholder and unusable as player-facing audio. The lessons apply
to any engine: synthesise from **normalised Latin** produced by `core/text`, and add an engine-specific
input mapping (for espeak, ʼ → `'`) that is tested in the generator.

## What this spike could not verify
The session's network allows only package registries. Opening access to Wikimedia/Lingua Libre/Hugging Face
was proposed and declined, and no Azure key was available, so:
- **No Azure or MMS sample was generated**, and the "quality (sample 20 words)" criterion is met only for
  espeak-ng.
- **Lingua Libre / Commons coverage of the top 1000 was not counted.** It needs C1's frequency list and a query
  of the Commons category for Uzbek pronunciations.
- All 📄 rows come from vendor documentation as I last knew it. Re-check prices, voice availability and terms
  when the key is set up.

To close these gaps (one session, about an hour):
1. Allow `<region>.tts.speech.microsoft.com` and save an Azure Speech key through the credential flow.
2. Allow `commons.wikimedia.org` and `upload.wikimedia.org` (and `lingualibre.org`).
3. Generate the same 20 words with Madina and Sardor, add them to the listen page next to espeak, and have a
   native speaker rate each word (correct / odd / wrong). Count Commons coverage against C1's top 1000.

## Implementation notes (for the follow-up audio task)
- `AudioProvider` (technical-design §7) gets a `FileAudioProvider`, which reads a generated
  `audio-manifest.json` (`itemId → { voice, file, bytes, sha256, source, licence }`), plus a
  `WebSpeechAudioProvider` fallback.
- The generator is a `content:build` step and is idempotent: it hashes (text, voice, engine version) and skips
  files that are unchanged. It runs with `--engine espeak` in CI and `--engine azure` locally.
- Browser support: check `canPlayType('audio/ogg; codecs=opus')` at runtime and fall back to MP3, because older
  Safari versions do not play Ogg Opus.
- Size budget: about 3 MB per voice for the top 1000 words. Precache the words of unlocked levels, not all of
  them.
- Attribution: every non-TTS file carries `source` and `licence` in the manifest, and a credits screen lists
  them.

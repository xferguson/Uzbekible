# Game 3: Wordfall (Say it!)

> Working title (alternatives: *Ayt!* = "Say it!", *Osmon* = sky). **Status: backlog. Speech-recognition risk.**

## Pitch
Words fall (or drift) across a tilework sky toward a palace wall. **Say a word out loud** and it gets zapped:
the tile shatters into a star burst. Let one hit the wall and a tile in the wall cracks. Words come faster and
thicker as you go. It's a typing-game arcade loop, but with your voice.

## Core loop (draft)
1. Words (Uzbek, in the chosen script) spawn at the top and move down or sideways along paths shaped like
   arabesque curves.
2. The mic listens continuously. Speech recognition returns candidate transcripts, which are fuzzy-matched
   against **on-screen words only** (via `core/similarity` + `core/text` normalization).
3. A matched word is zapped and scores points (more for words lower on the screen: risk/reward), plus a combo for chains.
4. A word that reaches the bottom cracks the wall (lives). Three cracks and you're out. Survive N waves to clear the level.
5. Levels raise speed, spawn rate, word length and frequency band.

## Trains
Reading speed (decoding Latin or Cyrillic quickly) and pronunciation (it has to be recognizable).

## Dependencies on shared modules
`core/speech` (SpeechRecognizer interface + fakes), `core/similarity`, `core/text`, `core/clock` (frame loop),
`core/random`, `core/session`, `core/scoring`, `core/difficulty`, `ui/Tile`, `core/learning-log`
(log the recognized transcript and confidence for pronunciation research).

## Open questions and risks
- **Uzbek speech-to-text availability** (spike **S2**): Web Speech API `uz-UZ` support differs by browser, is
  usually server-backed (online only) and is absent on some platforms. Alternatives to evaluate: a cloud STT with
  Uzbek support (Google, Azure), on-device models (Whisper-small via WebGPU/wasm, Vosk); and a keyword-spotting
  approach (we only need to know *which on-screen word* was said, not do open transcription).
- Matching tolerance: how fuzzy before it feels unfair, or too easy?
- Fallback when the mic is unavailable: a typing mode, so the game still works.
- Privacy: audio stays on-device where possible, and this is stated clearly.

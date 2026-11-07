#!/usr/bin/env bash
# S1 spike: regenerate the 20 espeak-ng sample words (Opus 24 kbps + MP3 32 kbps).
# Needs espeak-ng and ffmpeg. Usage: generate-espeak.sh <out-dir>
set -euo pipefail
out="${1:?out dir}"; mkdir -p "$out"
here="$(cd "$(dirname "$0")" && pwd)"
trim="silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
i=0
while IFS=$'\t' read -r lat cyr; do
  i=$((i+1)); n=$(printf %02d "$i")
  # espeak reads U+02BC ʼ as a symbol name; feed it an ASCII apostrophe instead.
  input="${lat//ʼ/\'}"
  espeak-ng -v uz -s 140 -w "$out/$n.wav" "$input"
  ffmpeg -nostdin -loglevel error -y -i "$out/$n.wav" -af "$trim" -ac 1 -ar 24000 -c:a libopus -b:a 24k "$out/$n.opus"
  ffmpeg -nostdin -loglevel error -y -i "$out/$n.opus" -c:a libmp3lame -b:a 32k "$out/$n.mp3"
  rm "$out/$n.wav"
done < "$here/words.tsv"

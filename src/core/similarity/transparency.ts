import type { UzScript } from '../text';
import { letterDistance, lettersOf } from './distance';
import { applyRules } from './rules';

/**
 * How transparent a Turkish→Uzbek pair is for someone who knows the sound correspondences, in [0, 1]:
 * 1 − (letter distance to the closest rule-derived candidate ÷ its length). `uz` must be Latin
 * (convert Cyrillic with `cyrlToLatn` first). Regular cognates (göz→koʻz) score 1, irregular pairs
 * (ev→uy) near 0.
 */
export function transparency(tr: string, uz: string): number {
  const target = lettersOf(uz);
  let best = 0;
  for (const candidate of applyRules(tr)) {
    const letters = lettersOf(candidate);
    const longest = Math.max(letters.length, target.length);
    const score = longest === 0 ? 1 : 1 - letterDistance(letters, target) / longest;
    if (score > best) best = score;
  }
  return best;
}

export interface Match {
  value: string;
  index: number;
  distance: number;
}

/**
 * Closest candidate to `input` within `threshold` letter edits (default 1), or undefined. Ties go to the
 * earlier candidate. Used for fuzzy answers in Wordfall.
 */
export function bestMatch(
  input: string,
  candidates: readonly string[],
  threshold = 1,
  script: UzScript = 'uz-Latn',
): Match | undefined {
  const typed = lettersOf(input, script);
  let best: Match | undefined;
  candidates.forEach((value, index) => {
    const d = letterDistance(typed, lettersOf(value, script));
    if (d <= threshold && (best === undefined || d < best.distance)) best = { value, index, distance: d };
  });
  return best;
}

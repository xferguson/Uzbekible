import { canonicalizeUz, toLetters, type UzScript } from '../text/index.ts';

/** Game letters of a word after NFC, canonical Uzbek apostrophes and lower-casing. */
export function lettersOf(word: string, script: UzScript = 'uz-Latn'): string[] {
  return toLetters(canonicalizeUz(word).toLowerCase(), script);
}

/**
 * Damerau-Levenshtein distance (unrestricted: insertions, deletions, substitutions and adjacent
 * transpositions each cost 1) over game letters, so sh/ch/ng/oʻ/gʻ count as one letter and case and
 * apostrophe spelling are ignored. A true metric: symmetric, 0 iff equal, triangle inequality.
 */
export function distance(a: string, b: string, script: UzScript = 'uz-Latn'): number {
  return letterDistance(lettersOf(a, script), lettersOf(b, script));
}

/** Lowrance–Wagner Damerau-Levenshtein over pre-split letters. */
export function letterDistance(a: readonly string[], b: readonly string[]): number {
  const n = a.length;
  const m = b.length;
  const maxDist = n + m;
  const width = m + 2;
  const d: number[] = new Array<number>((n + 2) * width).fill(0);
  const at = (i: number, j: number): number => d[i * width + j] as number;
  const set = (i: number, j: number, v: number): void => {
    d[i * width + j] = v;
  };
  const lastRow = new Map<string, number>();
  set(0, 0, maxDist);
  for (let i = 0; i <= n; i++) {
    set(i + 1, 0, maxDist);
    set(i + 1, 1, i);
  }
  for (let j = 0; j <= m; j++) {
    set(0, j + 1, maxDist);
    set(1, j + 1, j);
  }
  for (let i = 1; i <= n; i++) {
    let lastMatchCol = 0;
    for (let j = 1; j <= m; j++) {
      const i1 = lastRow.get(b[j - 1] as string) ?? 0;
      const j1 = lastMatchCol;
      const same = a[i - 1] === b[j - 1];
      if (same) lastMatchCol = j;
      set(
        i + 1,
        j + 1,
        Math.min(
          at(i, j) + (same ? 0 : 1),
          at(i + 1, j) + 1,
          at(i, j + 1) + 1,
          at(i1, j1) + (i - i1 - 1) + 1 + (j - j1 - 1),
        ),
      );
    }
    lastRow.set(a[i - 1] as string, i);
  }
  return at(n + 1, m + 1);
}

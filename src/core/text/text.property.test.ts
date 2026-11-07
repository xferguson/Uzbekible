import fc from 'fast-check';
import { describe, it } from 'vitest';
import {
  canonicalizeUz,
  cyrlToLatn,
  foldApostrophes,
  latnToCyrl,
  normalize,
  toLetters,
} from './index.ts';

const opts = { seed: 20240607, numRuns: 300 };

// Native-Uzbek Latin "letters" (no loan-only ts; e after a vowel is excluded because it is not native).
const letters = [
  'a',
  'b',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'x',
  'y',
  'z',
  'sh',
  'ch',
  'ng',
  'oʻ',
  'gʻ',
  'ʼ',
];

const nativeWord = fc
  .array(fc.constantFrom(...letters), { minLength: 1, maxLength: 9 })
  .filter((ls) => {
    for (let i = 0; i < ls.length; i++) {
      const cur = ls[i]!;
      const prev = ls[i - 1];
      const next = ls[i + 1];
      // e after a vowel is written э and read back as e: fine, but y+vowel combos collapse (ya → я) and
      // tutuq at the edges, ng/sh/ch splits and "n"+"g" adjacency are ambiguous by design.
      if (cur === 'y' && next && /^[aou]|^e/.test(next) && next !== 'oʻ') return false;
      if (cur === 'n' && next && next.startsWith('g')) return false;
      if (cur === 's' && next === 'h') return false;
      if (cur === 'c') return false;
      if (cur === 't' && next === 's') return false;
      if (cur === 'ʼ' && (i === 0 || i === ls.length - 1)) return false;
      if (cur === '\u02BC' && prev && /[og]$/.test(prev)) return false;
    }
    return true;
  })
  .map((ls) => ls.join(''));

const anyText = fc.string({ unit: 'binary', maxLength: 30 });

describe('text properties', () => {
  it('normalize is idempotent', () => {
    fc.assert(
      fc.property(anyText, (s) => normalize(normalize(s)) === normalize(s)),
      opts,
    );
  });

  it('canonicalizeUz is idempotent and fold-equivalent to its input', () => {
    fc.assert(
      fc.property(anyText, (s) => {
        const c = canonicalizeUz(s);
        return canonicalizeUz(c) === c && foldApostrophes(c) === foldApostrophes(normalize(s));
      }),
      opts,
    );
  });

  it('cyrlToLatn(latnToCyrl(x)) === x for native words', () => {
    fc.assert(
      fc.property(nativeWord, (w) => cyrlToLatn(latnToCyrl(w)) === w),
      opts,
    );
  });

  it('latnToCyrl(cyrlToLatn(x)) is stable once converted', () => {
    fc.assert(
      fc.property(nativeWord, (w) => {
        const c = latnToCyrl(w);
        return latnToCyrl(cyrlToLatn(c)) === c;
      }),
      opts,
    );
  });

  it('toLetters(w).join("") === w for canonical Uzbek words', () => {
    fc.assert(
      fc.property(nativeWord, (w) => toLetters(w, 'uz-Latn').join('') === w),
      opts,
    );
  });

  it('toLetters never yields an empty letter', () => {
    fc.assert(
      fc.property(nativeWord, (w) => toLetters(w, 'uz-Latn').every((l) => l.length > 0)),
      opts,
    );
  });
});

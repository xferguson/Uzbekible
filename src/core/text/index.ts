/**
 * core/text: the single home for Unicode normalization, apostrophe handling, Turkish casing,
 * Uzbek letters and Latin↔Cyrillic transliteration. Games, UI and content scripts import from here.
 * See the `uzbek-text-rules` skill.
 */

export type UzScript = 'uz-Latn' | 'uz-Cyrl';
export type Lang = UzScript | 'tr' | 'ru' | 'fa' | 'ar';

export interface ScriptMeta {
  dir: 'ltr' | 'rtl';
  bcp47: string;
  /** CSS custom-property reference from the design tokens. */
  fontStack: string;
}

const MODIFIER_TURNED_COMMA = 'ʻ'; // ʻ: oʻ, gʻ
const MODIFIER_APOSTROPHE = 'ʼ'; // ʼ: tutuq belgisi
const ZWNJ = '‌';
const APOSTROPHES = "'‘’`ʻʼ";

const isApostrophe = (ch: string | undefined): boolean => ch !== undefined && ch !== '' && APOSTROPHES.includes(ch);
const isLetter = (ch: string | undefined): boolean =>
  ch !== undefined && /[\p{L}ʻʼ]/u.test(ch);
const isUpper = (ch: string | undefined): boolean =>
  ch !== undefined && ch !== ch.toLowerCase();
const lower = (ch: string | undefined): string => (ch ?? '').toLowerCase();

/** Unicode NFC. */
export function normalize(s: string): string {
  return s.normalize('NFC');
}

/** Maps every apostrophe variant (' ‘ ’ ` ʻ ʼ) to a plain `'` so spellings compare equal. */
export function foldApostrophes(s: string): string {
  return Array.from(s, (ch) => (isApostrophe(ch) ? "'" : ch)).join('');
}

/** NFC plus canonical Uzbek apostrophes: oʻ/gʻ use U+02BB, every other apostrophe (tutuq) uses U+02BC. */
export function canonicalizeUz(s: string): string {
  const chars = Array.from(normalize(s));
  return chars
    .map((ch, i) => {
      if (!isApostrophe(ch)) return ch;
      return 'ogOG'.includes(chars[i - 1] ?? '-') ? MODIFIER_TURNED_COMMA : MODIFIER_APOSTROPHE;
    })
    .join('');
}

/** Turkish-aware lower-casing (I → ı, İ → i). */
export function toLowerTr(s: string): string {
  return s.toLocaleLowerCase('tr');
}

/** Turkish-aware upper-casing (ı → I, i → İ). */
export function toUpperTr(s: string): string {
  return s.toLocaleUpperCase('tr');
}

/**
 * Splits a word into game letters. In Latin, sh, ch, ng, oʻ and gʻ are single letters (any apostrophe
 * spelling is recognised, original characters are kept); tutuq is its own letter; a zero-width non-joiner
 * between s and h (or any pair) breaks a digraph and is dropped. Cyrillic is split by code point.
 * Input is normalized to NFC first.
 */
export function toLetters(word: string, script: UzScript): string[] {
  const chars = Array.from(normalize(word));
  if (script === 'uz-Cyrl') return chars.filter((ch) => ch !== ZWNJ);
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const next = chars[i + 1];
    if (ch === ZWNJ) continue;
    const c = lower(ch);
    const pair = c + lower(next);
    if ((c === 'o' || c === 'g') && isApostrophe(next)) {
      out.push(ch + next!);
      i += 1;
    } else if (pair === 'sh' || pair === 'ch' || (pair === 'ng' && !isApostrophe(chars[i + 2]))) {
      out.push(ch + next!);
      i += 1;
    } else {
      out.push(ch);
    }
  }
  return out;
}

const VOWELS_LATN = new Set(['a', 'e', 'i', 'o', 'u']);
const VOWELS_CYRL = new Set([...'аеёэиоуўюя']);

const LATN_TO_CYRL: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н',
  o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з',
  [MODIFIER_APOSTROPHE]: 'ъ',
};

const CYRL_TO_LATN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
  ч: 'ch', ш: 'sh', ъ: MODIFIER_APOSTROPHE, э: 'e', ю: 'yu', я: 'ya',
  ў: `o${MODIFIER_TURNED_COMMA}`, қ: 'q', ғ: `g${MODIFIER_TURNED_COMMA}`, ҳ: 'h',
};

const lettersOf = (s: string): string => s.replace(/[^\p{L}]/gu, '');

/** Gives `out` the capitalisation of the source token: ALL CAPS, Capitalised or lower. */
function matchCase(src: string, out: string): string {
  const letters = lettersOf(src);
  if (letters.length > 1 && letters === letters.toUpperCase()) return out.toUpperCase();
  if (isUpper(Array.from(src)[0])) {
    const [first = '', ...rest] = Array.from(out);
    return first.toUpperCase() + rest.join('');
  }
  return out;
}

/** Uzbek Latin → Cyrillic. Word-initial `ts` becomes ц; medial ц in loans needs the stored Cyrillic. */
export function latnToCyrl(text: string): string {
  const chars = Array.from(canonicalizeUz(text));
  let out = '';
  let afterVowel = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch === ZWNJ) continue;
    const c = lower(ch);
    const next = lower(chars[i + 1]);
    const wordStart = !isLetter(chars[i - 1]);
    let src = ch;
    let cyrl: string | undefined;
    if ((c === 'o' || c === 'g') && chars[i + 1] === MODIFIER_TURNED_COMMA) {
      src = ch + MODIFIER_TURNED_COMMA;
      cyrl = c === 'o' ? 'ў' : 'ғ';
    } else if (c === 'y' && next === 'e') {
      src = ch + chars[i + 1]!;
      cyrl = 'е';
    } else if (c === 'y' && chars[i + 2] !== MODIFIER_TURNED_COMMA && (next === 'o' || next === 'u' || next === 'a')) {
      src = ch + chars[i + 1]!;
      cyrl = { o: 'ё', u: 'ю', a: 'я' }[next];
    } else if (c + next === 'sh' || c + next === 'ch') {
      src = ch + chars[i + 1]!;
      cyrl = c === 's' ? 'ш' : 'ч';
    } else if (c + next === 'ng' && chars[i + 2] !== MODIFIER_TURNED_COMMA) {
      src = ch + chars[i + 1]!;
      cyrl = 'нг';
    } else if (c + next === 'ts' && wordStart) {
      src = ch + chars[i + 1]!;
      cyrl = 'ц';
    } else if (c === 'e') {
      cyrl = wordStart || afterVowel ? 'э' : 'е';
    } else {
      cyrl = LATN_TO_CYRL[c];
    }
    if (cyrl === undefined) {
      out += ch;
      afterVowel = false;
      continue;
    }
    out += matchCase(src, cyrl);
    const last = lower(Array.from(src).pop());
    afterVowel = VOWELS_LATN.has(last) || last === MODIFIER_TURNED_COMMA;
    i += Array.from(src).length - 1;
  }
  return out;
}

/** Uzbek Cyrillic → Latin (canonical apostrophes). е is `ye` at word start and after a vowel, else `e`. */
export function cyrlToLatn(text: string): string {
  const chars = Array.from(normalize(text));
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const c = lower(ch);
    const prev = chars[i - 1];
    let latn: string | undefined;
    if (c === 'е') {
      latn = !isLetter(prev) || VOWELS_CYRL.has(lower(prev)) ? 'ye' : 'e';
    } else {
      latn = CYRL_TO_LATN[c];
    }
    if (latn === undefined) {
      out += ch;
      continue;
    }
    if (!isUpper(ch)) {
      out += latn;
    } else {
      const capsContext = isUpper(prev) || isUpper(chars[i + 1]);
      out += matchCase(capsContext ? ch + ch : ch, latn);
    }
  }
  return out;
}

const META: Record<Lang, ScriptMeta> = {
  'uz-Latn': { dir: 'ltr', bcp47: 'uz-Latn', fontStack: 'var(--font-ui)' },
  'uz-Cyrl': { dir: 'ltr', bcp47: 'uz-Cyrl', fontStack: 'var(--font-ui)' },
  tr: { dir: 'ltr', bcp47: 'tr', fontStack: 'var(--font-ui)' },
  ru: { dir: 'ltr', bcp47: 'ru', fontStack: 'var(--font-ui)' },
  fa: { dir: 'rtl', bcp47: 'fa', fontStack: 'var(--font-fa)' },
  ar: { dir: 'rtl', bcp47: 'ar', fontStack: 'var(--font-naskh)' },
};

/** Direction, BCP-47 tag and font-stack token for a language (use instead of hardcoding `dir`). */
export function scriptMeta(lang: Lang): ScriptMeta {
  return { ...META[lang] };
}

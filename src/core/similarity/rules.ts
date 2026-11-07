import { canonicalizeUz, toLowerTr } from '../text';

/** Where in the Turkish word a rule may fire. */
export type RuleContext = {
  at?: 'initial' | 'final' | 'any';
  /** The next letter is a back vowel (`a ı o u`). */
  before?: 'back';
  /** The previous letter is a back vowel. */
  after?: 'back';
};

export interface Rule {
  id: string;
  /** Turkish letters matched (lower case). */
  pattern: string;
  /** Uzbek Latin replacement (canonical ʻ for oʻ/gʻ). */
  replacement: string;
  context: RuleContext;
  /**
   * Mandatory rules are spelling conversions: the Turkish letter does not exist in Uzbek, so the
   * unchanged letter is not offered. Optional rules are Turkic sound shifts that may or may not apply.
   */
  mandatory: boolean;
  note: string;
}

const optional = (
  id: string,
  pattern: string,
  replacement: string,
  context: RuleContext,
  note: string,
): Rule => ({
  id,
  pattern,
  replacement,
  context,
  mandatory: false,
  note,
});
const spelling = (pattern: string, replacement: string): Rule => ({
  id: `${pattern}>${replacement}`,
  pattern,
  replacement,
  context: { at: 'any' },
  mandatory: true,
  note: 'orthography',
});

/** Turkish→Uzbek correspondences (see the `cognate-research` skill, section 4). Data, not code. */
export const RULES: readonly Rule[] = [
  spelling('ö', 'oʻ'),
  spelling('ü', 'u'),
  spelling('ı', 'i'),
  spelling('ş', 'sh'),
  spelling('ç', 'ch'),
  spelling('c', 'j'),
  spelling('ğ', 'gʻ'),
  optional('g>k-initial', 'g', 'k', { at: 'initial' }, 'göz→koʻz, gelmek→kelmoq, gün→kun'),
  optional('d>t-initial', 'd', 't', { at: 'initial' }, 'dil→til, dağ→togʻ'),
  optional('v>b-initial', 'v', 'b', { at: 'initial' }, 'ver-→ber-'),
  optional('p>b-final', 'p', 'b', { at: 'final' }, 'kitap→kitob'),
  optional('k>q-before-back', 'k', 'q', { before: 'back' }, 'kara→qora, kız→qiz'),
  optional('k>q-final-back', 'k', 'q', { at: 'final', after: 'back' }, 'ak→oq, ışık→yoruq'),
  optional('a>o', 'a', 'o', { at: 'any' }, 'baş→bosh, al-→ol-, kara→qora'),
  optional('o>oʻ', 'o', 'oʻ', { at: 'any' }, 'yol→yoʻl, kol→qoʻl'),
  optional('mak>moq-final', 'mak', 'moq', { at: 'final' }, 'infinitive -mak→-moq'),
  optional('mek>moq-final', 'mek', 'moq', { at: 'final' }, 'infinitive -mek→-moq'),
];

/** Cap on candidates returned by `applyRules` (long words multiply options exponentially). */
const MAX_CANDIDATES = 256;
const MAX_EXPANSION = 5000;

const BACK = 'aıou';

function fires(rule: Rule, chars: readonly string[], i: number): boolean {
  const end = i + Array.from(rule.pattern).length;
  if (chars.slice(i, end).join('') !== rule.pattern) return false;
  const { at, before, after } = rule.context;
  if (at === 'initial' && i !== 0) return false;
  if (at === 'final' && end !== chars.length) return false;
  if (before === 'back' && !BACK.includes(chars[end] ?? '-')) return false;
  if (after === 'back' && !BACK.includes(chars[i - 1] ?? '-')) return false;
  return true;
}

interface Option {
  take: number;
  text: string;
  shifts: number;
}

function optionsAt(chars: readonly string[], i: number): Option[] {
  const matching = RULES.filter((r) => fires(r, chars, i));
  const options: Option[] = matching.map((r) => ({
    take: Array.from(r.pattern).length,
    text: r.replacement,
    shifts: r.mandatory ? 0 : 1,
  }));
  if (!matching.some((r) => r.mandatory))
    options.push({ take: 1, text: chars[i] as string, shifts: 0 });
  return options;
}

/**
 * Candidate Uzbek (Latin) forms of a Turkish word: spelling conversions always apply, each Turkic sound
 * shift may or may not. Unique, lower case, canonical apostrophes, at most 256, most-shifted first.
 */
export function applyRules(tr: string): string[] {
  const chars = Array.from(toLowerTr(tr.normalize('NFC')));
  const found = new Map<string, number>();
  const walk = (i: number, text: string, shifts: number): void => {
    if (found.size >= MAX_EXPANSION) return;
    if (i >= chars.length) {
      const form = canonicalizeUz(text);
      found.set(form, Math.max(found.get(form) ?? 0, shifts));
      return;
    }
    for (const o of optionsAt(chars, i)) walk(i + o.take, text + o.text, shifts + o.shifts);
  };
  walk(0, '', 0);
  return [...found.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, MAX_CANDIDATES)
    .map(([form]) => form);
}

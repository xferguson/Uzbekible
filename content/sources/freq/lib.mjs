// Pure helpers for building the C1 Uzbek frequency lemma list.
//
// These are deliberately local: `src/core/text` (task K1) is not on main yet. When it lands, C5's content
// pipeline should replace foldApostrophes / cyrlToLatn / latnToCyrl here with the core/text versions and keep
// these tests as regression cases.

export const OKINA = 'ʻ'; // ʻ  (oʻ, gʻ)
export const TUTUQ = 'ʼ'; // ʼ  (tutuq belgisi)

// Every apostrophe-like character seen in the corpora.
const APOS = "'`‘’ʻʼ´ʹ′";
const APOS_CLASS = `[${APOS}]`;

/** NFC, then oʻ/gʻ with U+02BB, and any other in-word apostrophe as the tutuq U+02BC. */
export function foldApostrophes(s) {
  return s
    .normalize('NFC')
    .replace(new RegExp(`([oOgG])${APOS_CLASS}`, 'gu'), `$1${OKINA}`)
    .replace(new RegExp(`(?<=\\p{L})(?<![oOgG])${APOS_CLASS}(?=\\p{L})`, 'gu'), TUTUQ);
}

const UZ_LATN_WORD = new RegExp(`^[a-z${OKINA}${TUTUQ}]*[a-z][a-z${OKINA}${TUTUQ}]*$`, 'u');
const RAW_TOKEN = new RegExp(`[\\p{L}\\p{M}${APOS}]+`, 'gu');
const SENTENCE_END = /[.!?…]/u;

/**
 * Split a line of Uzbek Latin text into word tokens.
 * Returns [{ form, cap, initial }]: lowercased canonical form, whether it was capitalised in the source, and
 * whether it starts a sentence (used to tell proper nouns from sentence-initial capitals).
 */
export function tokenize(line) {
  const out = [];
  let prevEnd = 0;
  let first = true;
  for (const m of line.normalize('NFC').matchAll(RAW_TOKEN)) {
    const gap = line.slice(prevEnd, m.index);
    prevEnd = m.index + m[0].length;
    const initial = first || SENTENCE_END.test(gap);
    first = false;
    // Leading apostrophes are opening quotes; a trailing one is a letter only after o/g (togʻ).
    let raw = m[0].replace(new RegExp(`^${APOS_CLASS}+`, 'u'), '');
    raw = raw.replace(new RegExp(`(?<![oOgG])${APOS_CLASS}+$`, 'u'), '');
    raw = raw.replace(new RegExp(`([oOgG]${APOS_CLASS})${APOS_CLASS}+$`, 'u'), '$1');
    if (!raw) continue;
    const form = foldApostrophes(raw).toLowerCase();
    if (!UZ_LATN_WORD.test(form)) continue;
    out.push({ form, cap: raw[0] !== raw[0].toLowerCase(), initial });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Transliteration (Uzbek only, lowercase input)

const CYRL_VOWELS = new Set('аеёиоуэюяў');
const C2L = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: TUTUQ, ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: `o${OKINA}`, қ: 'q', ғ: `g${OKINA}`, ҳ: 'h',
};

export function cyrlToLatn(word) {
  const w = word.normalize('NFC').toLowerCase();
  let out = '';
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    const prev = i > 0 ? w[i - 1] : '';
    if (c === 'е') {
      out += i === 0 || CYRL_VOWELS.has(prev) || prev === 'ъ' || prev === 'ь' ? 'ye' : 'e';
    } else if (c === 'ц') {
      out += i > 0 && CYRL_VOWELS.has(prev) ? 'ts' : 's';
    } else {
      out += c in C2L ? C2L[c] : c;
    }
  }
  return out;
}

const LATN_VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const L2C_DIGRAPHS = [
  [`o${OKINA}`, 'ў'], [`g${OKINA}`, 'ғ'], ['sh', 'ш'], ['ch', 'ч'], ['yo', 'ё'], ['yu', 'ю'], ['ya', 'я'], ['ye', 'е'],
];
const L2C = {
  a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
  p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', [TUTUQ]: 'ъ',
};

export function latnToCyrl(word) {
  const w = word.normalize('NFC').toLowerCase();
  let out = '';
  let i = 0;
  outer: while (i < w.length) {
    for (const [lat, cyr] of L2C_DIGRAPHS) {
      if (w.startsWith(lat, i)) {
        out += cyr;
        i += lat.length;
        continue outer;
      }
    }
    const c = w[i];
    if (c === 'e') out += i === 0 || LATN_VOWELS.has(w[i - 1]) ? 'э' : 'е';
    else out += c in L2C ? L2C[c] : c;
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Apertium (hfst-lookup) analyses → lemma choice

/** Parse `hfst-lookup` output into Map<form, [{stem, tags}]>. Clitic tails (+e<cop>…) are dropped. */
export function parseAnalyses(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    if (!line) continue;
    const [form, analysis] = line.split('\t');
    if (analysis === undefined) continue;
    if (!map.has(form)) map.set(form, []);
    if (analysis.endsWith('+?')) continue;
    const head = analysis.split('+')[0];
    const lt = head.indexOf('<');
    if (lt <= 0) continue;
    const stem = head.slice(0, lt);
    const tags = [...head.matchAll(/<([^>]+)>/g)].map((m) => m[1]);
    const list = map.get(form);
    if (!list.some((a) => a.stem === stem && a.tags.join() === tags.join())) list.push({ stem, tags });
  }
  return map;
}

const POS_OF_TAG = {
  n: 'noun', v: 'verb', vaux: 'aux', adj: 'adj', adv: 'adv', prn: 'pron', det: 'det', post: 'adp', postadv: 'adv',
  cnjcoo: 'conj', cnjsub: 'conj', cnjadv: 'conj', num: 'num', ij: 'intj', cop: 'aux', mod: 'part', qst: 'part',
  emph: 'part', part: 'part',
};
// Lower is preferred when several readings survive (see METHOD in SOURCES.md).
const POS_PRIORITY = ['aux', 'pron', 'adp', 'conj', 'num', 'det', 'adv', 'adj', 'noun', 'verb', 'intj', 'part'];
const EXCLUDED_TAGS = new Set(['np', 'abbr', 'sent', 'cm', 'guio', 'lquot', 'rquot', 'apos']);

// Forms whose closed-class reading the analyser offers but which UD Uzbek annotates as a verb form.
const OVERRIDES = new Map([
  ['deb', { stem: 'de', pos: 'verb' }],
  ['deya', { stem: 'de', pos: 'verb' }],
]);

function copulaLemma(tags) {
  if (tags.includes('neg')) return 'emas';
  if (tags.includes('evid')) return 'ekan';
  if (tags.includes('ifi') || tags.includes('past')) return 'edi';
  return 'emish';
}

function toCandidate(form, { stem, tags }) {
  if (tags.length === 0 || tags.some((t) => EXCLUDED_TAGS.has(t))) return null;
  const pos = POS_OF_TAG[tags[0]];
  if (!pos) return null;
  const lemma = tags[0] === 'cop' ? copulaLemma(tags) : stem.toLowerCase();
  const whole = lemma === form;
  // 0: whole-word non-verb reading; 1: whole-word verb (imperative); 2: segmented reading.
  const shape = whole ? (pos === 'verb' ? 1 : 0) : 2;
  return { stem: lemma, pos, shape, rank: POS_PRIORITY.indexOf(pos), ntags: tags.length };
}

/** Pick one { stem, pos } for a surface form from its analyses, or null (proper noun, abbreviation, unknown). */
export function chooseCandidate(form, analyses) {
  if (OVERRIDES.has(form) && analyses.length > 0) return { ...OVERRIDES.get(form) };
  const cands = analyses.map((a) => toCandidate(form, a)).filter(Boolean);
  if (cands.length === 0) return null;
  cands.sort(
    (a, b) =>
      a.shape - b.shape ||
      a.rank - b.rank ||
      b.stem.length - a.stem.length ||
      a.ntags - b.ntags ||
      (a.stem < b.stem ? -1 : a.stem > b.stem ? 1 : 0),
  );
  return { stem: cands[0].stem, pos: cands[0].pos };
}

/** Dictionary citation form: verbs as the -moq infinitive (kel → kelmoq), everything else as the stem. */
export function citationForm({ stem, pos }) {
  return pos === 'verb' ? `${stem}moq` : stem;
}

// ---------------------------------------------------------------------------------------------------------
// Frequency normalisation and merging

const harmonicCache = new Map();
function harmonic(n) {
  if (!harmonicCache.has(n)) {
    let h = 0;
    for (let k = 1; k <= n; k++) h += 1 / k;
    harmonicCache.set(n, h);
  }
  return harmonicCache.get(n);
}

/** Zipf estimate of tokens-per-million for the word at `rank` in a ranked list of `n` types (f ∝ 1/rank). */
export function zipfPerMillion(rank, n) {
  return 1e6 / (rank * harmonic(n));
}

/**
 * Merge per-million frequency maps. Score = arithmetic mean over all sources (absent counts as 0); keys
 * attested in fewer than `minSources` sources are dropped. Sorted by score desc, then key asc.
 */
export function mergeSources(sources, { minSources }) {
  const keys = new Set();
  for (const s of sources) for (const k of s.keys()) keys.add(k);
  const out = [];
  for (const key of keys) {
    const present = [];
    let sum = 0;
    sources.forEach((s, i) => {
      if (s.has(key)) {
        present.push(i);
        sum += s.get(key);
      }
    });
    if (present.length < minSources) continue;
    out.push({ key, score: sum / sources.length, present });
  }
  out.sort((a, b) => b.score - a.score || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return out;
}

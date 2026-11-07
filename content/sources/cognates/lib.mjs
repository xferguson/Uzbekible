// Pure helpers for the C2 Turkish-partner build (content/sources/cognates/build.mjs).
// core/text (K1) and core/content (C5) are not on main yet, so these are local; see README.md.
// When C5 lands, its schema validator replaces validateItems and core/similarity (K8) can adopt the tag IDs.

export const OKINA = 'ʻ'; // U+02BB in oʻ, gʻ
export const TUTUQ = 'ʼ'; // U+02BC tutuq belgisi

export const RELATIONS = [
  'turkic-cognate',
  'shared-arabic',
  'shared-persian',
  'russian-loan',
  'persian-loan',
  'arabic-loan',
  'other-loan',
  'false-friend',
];
export const CONFIDENCES = ['high', 'medium', 'low'];

const CODES = {
  tc: 'turkic-cognate',
  sa: 'shared-arabic',
  sp: 'shared-persian',
  ol: 'other-loan',
  ff: 'false-friend',
};

/** Turkish-aware lowercase (İ → i, I → ı), NFC. */
export function lowerTr(s) {
  return s.normalize('NFC').toLocaleLowerCase('tr');
}

const CIRCUMFLEX = { â: 'a', î: 'i', û: 'u' };
const TR_MAP = { ş: 'sh', ç: 'ch', c: 'j' };

/** Turkish word → letter tokens in Uzbek-Latin terms (ş→sh, ç→ch, c→j); ı ö ü ğ stay as they are. */
export function trLetters(word) {
  const out = [];
  for (const ch of lowerTr(word)) {
    const c = CIRCUMFLEX[ch] ?? ch;
    out.push(TR_MAP[c] ?? c);
  }
  return out;
}

/** Uzbek Latin word → letter tokens (sh, ch, ng, oʻ, gʻ are single letters; ʼ is its own token). */
export function uzLetters(word) {
  const s = word.normalize('NFC').toLowerCase();
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (
      two === 'sh' ||
      two === 'ch' ||
      two === 'ng' ||
      two === `o${OKINA}` ||
      two === `g${OKINA}`
    ) {
      out.push(two);
      i++;
    } else {
      out.push(s[i]);
    }
  }
  return out;
}

/** Parse curated.tsv: rank, lemma, glossEn, tr (`text:code|text:code`, codes tc sa sp ol ff). */
export function parseCurated(text) {
  const lines = text
    .normalize('NFC')
    .split('\n')
    .filter((l) => l.trim() !== '');
  const [header, ...rest] = lines;
  if (header !== 'rank\tlemma\tglossEn\ttr')
    throw new Error(`curated.tsv: unexpected header ${header}`);
  return rest.map((line, n) => {
    const [rank, lemma, glossEn, tr = ''] = line.split('\t');
    const sources = tr
      .split('|')
      .filter((x) => x !== '')
      .map((x) => {
        const i = x.lastIndexOf(':');
        const code = x.slice(i + 1);
        const relation = CODES[code];
        if (i < 1 || !relation)
          throw new Error(`curated.tsv line ${n + 2}: unknown relation code in "${x}"`);
        return { text: x.slice(0, i), relation };
      });
    return { rank: Number(rank), lemma, glossEn, tr: sources };
  });
}

// --- sound correspondences (Turkish → Uzbek) --------------------------------------------------------------

const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', `o${OKINA}`]);
/** Substitutions that are tagged anywhere in the word. */
const SUBS = new Set([
  'a>o',
  'o>oʻ',
  'ö>oʻ',
  'ü>u',
  'ö>u',
  'ı>i',
  'e>a',
  'k>q',
  'ğ>gʻ',
  'ğ>g',
  'p>b',
  't>d',
  'ç>j',
  'h>x',
  'n>ng',
]);
/** Substitutions that are tagged only word-initially. */
const INITIAL_SUBS = new Set(['g>k', 'd>t', 'v>b', 'b>m']);
const LABEL = { sh: 'ş', ch: 'ç' };

function subTag(a, b, first) {
  const key = `${LABEL[a] ?? a}>${b}`;
  if (SUBS.has(key)) return key;
  if (first && INITIAL_SUBS.has(key)) return key;
  return null;
}

/** Edit alignment between token arrays; known shifts cost less so the alignment prefers them. */
function align(a, b) {
  const n = a.length;
  const m = b.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) d[i][0] = i;
  for (let j = 1; j <= m; j++) d[0][j] = j;
  const subCost = (i, j) => {
    if (a[i - 1] === b[j - 1]) return 0;
    return subTag(a[i - 1], b[j - 1], i === 1 && j === 1) ? 0.6 : 1.2;
  };
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j - 1] + subCost(i, j), d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const ops = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + subCost(i, j)) {
      if (a[i - 1] !== b[j - 1])
        ops.push({ op: 'sub', a: a[i - 1], b: b[j - 1], i: i - 1, j: j - 1 });
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ op: 'del', a: a[i - 1], i: i - 1, j });
      i--;
    } else {
      ops.push({ op: 'ins', b: b[j - 1], i, j: j - 1 });
      j--;
    }
  }
  return ops.reverse();
}

/**
 * Sound-shift tags for a Turkish → Uzbek pair (sorted, unique). Orthographic equivalences (ş/sh, ç/ch, c/j) are
 * not shifts. Two or more edits that no rule explains add `irregular` (the "hard pairs").
 */
export function correspondences(tr, uz) {
  let t = lowerTr(tr).replace(/\s+/g, '');
  let u = uz.normalize('NFC').toLowerCase().replace(/\s+/g, '');
  const tags = new Set();
  if (/m[ae]k$/.test(t) && /moq$/.test(u)) {
    tags.add('mak>moq');
    t = t.slice(0, -3);
    u = u.slice(0, -3);
  }
  const a = trLetters(t);
  const b = uzLetters(u);
  let untagged = 0;
  for (const o of align(a, b)) {
    let tag = null;
    if (o.op === 'sub') {
      tag = subTag(o.a, o.b, o.i === 0 && o.j === 0);
    } else if (o.op === 'del') {
      if (o.i === 0 && o.a === 'v') tag = 'v>∅';
      else if (VOWELS.has(o.a) && o.i === a.length - 2 && !VOWELS.has(a[a.length - 1]))
        tag = 'epenthesis';
    } else if (o.b === TUTUQ) {
      tag = 'tutuq';
    } else if (o.j === 0 && (o.b === 'b' || o.b === 'y')) {
      tag = `∅>${o.b}`;
    }
    if (tag) tags.add(tag);
    else untagged++;
  }
  if (untagged >= 2) tags.add('irregular');
  return [...tags].sort();
}

// --- etymology evidence (EtymDB / Wiktionary) ----------------------------------------------------------------

const ARABIC = new Set(['ar', 'arc', 'sem-pro', 'acm', 'apc', 'arz']);
const PERSIAN = new Set(['fa', 'fa-cls', 'pal', 'peo', 'ira-pro', 'tg', 'sog', 'xpr', 'prp']);
const TURKIC_NEUTRAL = new Set([
  'ota',
  'tr',
  'uz',
  'trk-oat',
  'az',
  'kk',
  'ky',
  'tt',
  'ba',
  'ug',
  'tk',
  'crh',
  'kaa',
]);
const TURKIC_ROOT = new Set(['otk', 'chg', 'xqa', 'okt']);
const EUROPEAN = new Set([
  'fr',
  'frm',
  'fro',
  'it',
  'la',
  'la-lat',
  'la-vul',
  'grc',
  'gr',
  'el',
  'en',
  'enm',
  'ang',
  'de',
  'goh',
  'ru',
  'nl',
  'es',
  'pt',
  'bg',
  'gem-pro',
  'ine-pro',
  'itc-ol',
  'non',
]);

/** Origin class of an ancestor chain (nearest first): the first non-Turkic language decides. */
export function etymClass(langs) {
  let turkic = false;
  for (const l of langs) {
    if (ARABIC.has(l)) return 'arabic';
    if (PERSIAN.has(l)) return 'persian';
    if (TURKIC_ROOT.has(l) || l.startsWith('trk-')) {
      if (l !== 'trk-oat') turkic = true;
      continue;
    }
    if (TURKIC_NEUTRAL.has(l)) continue;
    return EUROPEAN.has(l) ? 'european' : 'other';
  }
  return turkic ? 'turkic' : null;
}

/** Does an ancestor chain support the claimed relation? */
export function supportsRelation(relation, langs) {
  switch (relation) {
    case 'turkic-cognate':
      return etymClass(langs) === 'turkic';
    case 'shared-arabic':
      return langs.some((l) => ARABIC.has(l));
    case 'shared-persian':
      return langs.some((l) => PERSIAN.has(l));
    case 'other-loan': {
      const c = etymClass(langs);
      return c === 'european' || c === 'other';
    }
    default:
      return false;
  }
}

/**
 * Confidence from two independent sources: the bilingual dictionary (meaning) and Wiktionary etymology (origin).
 * high = both, medium = one, low = neither. A false friend needs the dictionary to give the Uzbek word a
 * *different* Turkish translation (`otherMeaning` and not `meaning`); it is then medium with an etymology, else low.
 */
export function confidenceFor(relation, { meaning, otherMeaning = false, origin }) {
  if (relation === 'false-friend') return !meaning && otherMeaning && origin ? 'medium' : 'low';
  const n = Number(Boolean(meaning)) + Number(Boolean(origin));
  return n === 2 ? 'high' : n === 1 ? 'medium' : 'low';
}

// --- Apertium tur-uzb bilingual dictionary ------------------------------------------------------------------

/** Turkish infinitive from a verb stem, by the last vowel. */
export function trInfinitive(stem) {
  const v = [...stem].filter((c) => 'aeıioöuü'.includes(c)).pop();
  return stem + (v && 'eiöü'.includes(v) ? 'mek' : 'mak');
}

/** Parse apertium-tur-uzb.tur-uzb.dix → Map(uzbek stem → [{ text, verb }]). */
export function parseApertiumDix(xml) {
  const map = new Map();
  const side = (x) => ({
    word: x
      .replace(/<s n="[^"]*"\/>/g, '')
      .replace(/<b\/>/g, ' ')
      .replace(/<\/?g>|<j\/>/g, '')
      .normalize('NFC'),
    tags: [...x.matchAll(/<s n="([^"]*)"\/>/g)].map((m) => m[1]),
  });
  for (const m of xml.matchAll(/<e[^>]*>\s*<p><l>(.*?)<\/l>\s*<r>(.*?)<\/r><\/p><\/e>/g)) {
    const l = side(m[1]);
    const r = side(m[2]);
    const verb = l.tags[0] === 'v' || l.tags[0] === 'vaux';
    const text = verb ? trInfinitive(l.word) : l.word;
    const key = r.word.toLowerCase();
    const list = map.get(key) ?? [];
    if (!list.some((e) => e.text === text)) list.push({ text, verb });
    map.set(key, list);
  }
  return map;
}

// --- items ---------------------------------------------------------------------------------------------------

function slug(lemma) {
  return lemma
    .normalize('NFC')
    .toLowerCase()
    .replace(/[ʻʼ]/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Stable ids `uz-<slug>`; when two lemmas share a slug, the lower-ranked one gets `-<rank>`. */
export function itemIds(rows) {
  const byRank = [...rows].sort((x, y) => x.rank - y.rank);
  const taken = new Set();
  const id = new Map();
  for (const r of byRank) {
    let s = `uz-${slug(r.lemma)}`;
    if (taken.has(s)) s = `${s}-${r.rank}`;
    taken.add(s);
    id.set(r, s);
  }
  return rows.map((r) => id.get(r));
}

const UZ_LATN = /^[a-z ʻʼ-]+$/;
const APOSTROPHE_VARIANTS = /['‘’`´ʹ′]/;
const CYRL = /^[Ѐ-ӿ -]+$/;
const TR_LATN = /^[a-zçğıöşüâîûA-ZÇĞİÖŞÜÂÎÛ -]+$/;
const LANGS = ['tr', 'ru', 'fa', 'ar'];

/** Local stand-in for C5's validator: returns a list of error strings (empty = valid). */
export function validateItems(items) {
  const errs = [];
  const seen = new Set();
  for (const it of items) {
    const at = it?.id ?? '(no id)';
    if (typeof it?.id !== 'string' || !/^uz-[a-z0-9-]+$/.test(it.id)) errs.push(`${at}: bad id`);
    if (seen.has(it.id)) errs.push(`duplicate id ${it.id}`);
    seen.add(it.id);
    const latn = it.uz?.latn ?? '';
    if (APOSTROPHE_VARIANTS.test(latn))
      errs.push(`${at}: non-canonical apostrophe in uz.latn "${latn}"`);
    else if (!UZ_LATN.test(latn) || latn !== latn.normalize('NFC'))
      errs.push(`${at}: uz.latn is not Uzbek Latin`);
    if (!CYRL.test(it.uz?.cyrl ?? '')) errs.push(`${at}: uz.cyrl is not Cyrillic`);
    if (!Number.isInteger(it.freqRank) || it.freqRank < 1) errs.push(`${at}: bad freqRank`);
    if (!['lemma', 'inflected'].includes(it.form)) errs.push(`${at}: bad form`);
    if (typeof it.glossEn !== 'string' || it.glossEn.trim() === '')
      errs.push(`${at}: missing glossEn`);
    if (!Array.isArray(it.tags)) errs.push(`${at}: tags must be a list`);
    if (!Array.isArray(it.sources)) {
      errs.push(`${at}: sources must be a list`);
      continue;
    }
    for (const s of it.sources) {
      const where = `${at} [${s?.lang}:${s?.text}]`;
      if (!LANGS.includes(s.lang)) errs.push(`${where}: bad lang`);
      if (s.lang === 'tr' && !TR_LATN.test(s.text ?? ''))
        errs.push(`${where}: text is not Turkish Latin`);
      if (!RELATIONS.includes(s.relation)) errs.push(`${where}: bad relation ${s.relation}`);
      if (!CONFIDENCES.includes(s.confidence))
        errs.push(`${where}: bad confidence ${s.confidence}`);
      if (typeof s.ref !== 'string' || s.ref.trim() === '') errs.push(`${where}: missing ref`);
      if (
        s.correspondence !== undefined &&
        !(Array.isArray(s.correspondence) && s.correspondence.every((c) => typeof c === 'string'))
      ) {
        errs.push(`${where}: correspondence must be a list of tag ids`);
      }
    }
  }
  return errs;
}

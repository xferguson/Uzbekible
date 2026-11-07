// C4: Uzbek and Turkish inflection rules for the suffixes Uzbekible teaches (plural, possessive 1sg/2sg, locative,
// dative, ablative; past -di and present continuous, 1sg). Pure functions, no I/O. Only the regular patterns of
// the chosen lemmas are covered; irregular stems (Uzbek shahar → shahrim, Turkish şehir → şehrim) are left out of
// the lemma list rather than special-cased. Cyrillic is built with its own suffix spellings and checked against
// core/text in morph.test.mjs.

/** Noun forms: `suffixes` are the Uzbek endings stored on the item; `label` is the English hint. */
export const NOUN_FORMS = [
  { key: 'plural', tag: 'plural', suffixes: ['-lar'], label: 'plural' },
  { key: 'poss1', tag: 'possessive-1sg', suffixes: ['-im'], label: 'my' },
  { key: 'poss2', tag: 'possessive-2sg', suffixes: ['-ing'], label: 'your (sg.)' },
  { key: 'locative', tag: 'locative', suffixes: ['-da'], label: 'in, at' },
  { key: 'dative', tag: 'dative', suffixes: ['-ga'], label: 'to' },
  { key: 'ablative', tag: 'ablative', suffixes: ['-dan'], label: 'from' },
];
/** Verb forms (1sg). */
export const VERB_FORMS = [
  { key: 'past', tag: 'past', suffixes: ['-di', '-m'], label: 'I (past)' },
  {
    key: 'continuous',
    tag: 'present-continuous',
    suffixes: ['-yap', '-man'],
    label: 'I am (…-ing)',
  },
];

// ---------- Uzbek ----------
const UZ_VOWEL_LATN = /(?:[aeiou]|oʻ)$/;
const UZ_VOWEL_CYRL = /[аеёиоуэюяў]$/;

/** [latn, cyrl] for each noun form of an Uzbek noun. */
export function uzNoun(latn, cyrl) {
  const vl = UZ_VOWEL_LATN.test(latn);
  const vc = UZ_VOWEL_CYRL.test(cyrl);
  const back = /k$/.test(latn) ? 'ka' : /q$/.test(latn) ? 'qa' : 'ga';
  const back2 = /к$/.test(cyrl) ? 'ка' : /қ$/.test(cyrl) ? 'қа' : 'га';
  return {
    plural: [`${latn}lar`, `${cyrl}лар`],
    poss1: [vl ? `${latn}m` : `${latn}im`, vc ? `${cyrl}м` : `${cyrl}им`],
    poss2: [vl ? `${latn}ng` : `${latn}ing`, vc ? `${cyrl}нг` : `${cyrl}инг`],
    locative: [`${latn}da`, `${cyrl}да`],
    dative: [`${latn}${back}`, `${cyrl}${back2}`],
    ablative: [`${latn}dan`, `${cyrl}дан`],
  };
}

/** [latn, cyrl] for past and present continuous (1sg) of an Uzbek -moq verb. */
export function uzVerb(latn, cyrl) {
  if (!latn.endsWith('moq') || !cyrl.endsWith('моқ')) throw new Error(`not a -moq verb: ${latn}`);
  const sl = latn.slice(0, -3);
  const sc = cyrl.slice(0, -3);
  return {
    past: [`${sl}dim`, `${sc}дим`],
    continuous: [`${sl}yapman`, `${sc}япман`],
  };
}

// ---------- Turkish ----------
const TR_VOWELS = 'aeıioöuü';
const lastVowel = (w) => [...w].reverse().find((c) => TR_VOWELS.includes(c));
const endsInVowel = (w) => TR_VOWELS.includes(w.at(-1));
const isBack = (v) => 'aıou'.includes(v);
const isRound = (v) => 'oöuü'.includes(v);
const two = (v) => (isBack(v) ? 'a' : 'e');
const four = (v) => (isBack(v) ? (isRound(v) ? 'u' : 'ı') : isRound(v) ? 'ü' : 'i');
const VOICELESS = 'çfhkpsşt';

/** Stems that soften their final consonant before a vowel suffix (kitap → kitab-). */
const SOFTENED = { kitap: 'kitab', sebep: 'sebeb', mektep: 'mekteb' };
/** Vowel-final stems that take a buffer y before the possessive (su → suyum). */
const BUFFER_Y = new Set(['su']);
/** Loans that take front-vowel suffixes although their last vowel is back (saat → saatte, saatler). */
const FRONT_HARMONY = new Set(['saat']);

export function trNoun(w) {
  const v = FRONT_HARMONY.has(w) ? 'e' : lastVowel(w);
  const soft = SOFTENED[w] ?? w;
  const vowelFinal = endsInVowel(w);
  const cons = VOICELESS.includes(w.at(-1)) ? 't' : 'd';
  const poss = (suffixVowelFinal, suffixCons) => {
    const stem = BUFFER_Y.has(w) ? `${w}y` : soft;
    const sv = FRONT_HARMONY.has(w) ? 'e' : lastVowel(stem);
    return vowelFinal && !BUFFER_Y.has(w)
      ? `${soft}${suffixVowelFinal}`
      : `${stem}${four(sv)}${suffixCons}`;
  };
  return {
    plural: `${w}l${two(v)}r`,
    poss1: poss('m', 'm'),
    poss2: poss('n', 'n'),
    locative: `${w}${cons}${two(v)}`,
    dative: vowelFinal ? `${soft}y${two(v)}` : `${soft}${two(v)}`,
    ablative: `${w}${cons}${two(v)}n`,
  };
}

/** Verbs whose -iyor stem differs from the plain stem. */
const IYOR_STEM = { de: 'di', ye: 'yi', et: 'ed', git: 'gid' };

/** Past and present continuous (1sg) of a Turkish -mak/-mek verb. */
export function trVerb(inf) {
  const m = inf.match(/^(.+)m[ae]k$/);
  if (!m) throw new Error(`not a Turkish infinitive: ${inf}`);
  const stem = m[1];
  const v = lastVowel(stem);
  const past = `${stem}${VOICELESS.includes(stem.at(-1)) ? 't' : 'd'}${four(v)}m`;
  let base = IYOR_STEM[stem];
  if (base) {
    // irregular: the suffix vowel is fixed by the changed stem
    return {
      past,
      continuous: `${base}${four(lastVowel(base))}yorum`.replace(/(.)\1yorum$/, '$1yorum'),
    };
  }
  let cont;
  if (/[ae]$/.test(stem)) {
    // vowel-final a/e: drop it, then add the harmonised vowel (başla- → başlıyorum)
    const s = stem.slice(0, -1);
    cont = `${s}${four(lastVowel(s) ?? v)}yorum`;
  } else if (endsInVowel(stem)) {
    cont = `${stem}yorum`; // oku- → okuyorum, yürü- → yürüyorum
  } else {
    cont = `${stem}${four(v)}yorum`;
  }
  return { past, continuous: cont };
}

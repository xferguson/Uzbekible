// Pure helpers for the C3 Russian/Persian/Arabic loan-partner build (content/sources/loans/build.mjs).
// Etymology classes come from the C2 helpers so both builds read EtymDB the same way.
import { supportsRelation } from '../cognates/lib.mjs';

/** Partner language → relation of the Uzbek word to it. The partner is the *origin* word itself. */
export const LOAN_LANGS = { ru: 'russian-loan', fa: 'persian-loan', ar: 'arabic-loan' };

/** Parse curated.tsv: `rank, lemma, ru, fa, ar`; several partners in a cell are joined by `|`. */
export function parseLoanRows(text) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  return lines.slice(1).map((line, i) => {
    const c = line.split('\t');
    if (c.length !== 5)
      throw new Error(`curated row ${i + 2}: expected 5 columns, got ${c.length}`);
    const rank = Number(c[0]);
    if (!Number.isInteger(rank) || rank < 1)
      throw new Error(`curated row ${i + 2}: bad rank "${c[0]}"`);
    const cell = (s) =>
      s
        .split('|')
        .map((x) => x.trim())
        .filter(Boolean);
    return { rank, lemma: c[1], ru: cell(c[2]), fa: cell(c[3]), ar: cell(c[4]) };
  });
}

/** Fold Arabic-script text for comparison: no vowel marks or tatweel, Persian letters → Arabic letters. */
export function foldArabic(s) {
  return s
    .normalize('NFC')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[یى]/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/ۀ|ة|ە/g, 'ه')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و');
}

/** Fold Russian for comparison: lowercase, ё → е. */
export function foldRussian(s) {
  return s.normalize('NFC').toLowerCase().replace(/ё/g, 'е');
}

const RU = /^[а-яё]+( [а-яё]+)*$/;
// Vowel marks (U+064B-065F, U+0670) are valid in a class here; the lint rule only sees them as combining characters.
/* eslint-disable no-misleading-character-class */
const ARABIC_BLOCK = /^[ء-يً-ٰٟٱ ]+$/;
const PERSIAN_BLOCK = /^[ء-يً-ٰٟٱپچژکگیۀ‌ ]+$/;
/* eslint-enable no-misleading-character-class */
const PERSIAN_ONLY = /[پچژکگیۀ]/;

/** Errors for a partner written in the wrong script (empty list = fine). */
export function scriptErrors(lang, text) {
  if (lang === 'ru') return RU.test(text) ? [] : [`not lowercase Russian Cyrillic: "${text}"`];
  if (lang === 'ar') {
    if (PERSIAN_ONLY.test(text)) return [`Persian-only letter in Arabic text: "${text}"`];
    return ARABIC_BLOCK.test(text) ? [] : [`not Arabic script: "${text}"`];
  }
  if (lang === 'fa') return PERSIAN_BLOCK.test(text) ? [] : [`not Perso-Arabic script: "${text}"`];
  return [`unknown language ${lang}`];
}

/** Does an ancestor-language chain (EtymDB codes, nearest first) pass through the claimed origin language? */
export function originSupports(lang, chain) {
  if (lang === 'ru') return chain.includes('ru');
  return supportsRelation(lang === 'ar' ? 'shared-arabic' : 'shared-persian', chain);
}

/**
 * Confidence from two independent Wiktionary entries: the Uzbek entry's etymology and the Turkish partner's.
 * high = both trace to the claimed language, medium = one, low = neither (curator judgement only).
 */
export function loanConfidence({ uzOrigin, trOrigin }) {
  const n = Number(Boolean(uzOrigin)) + Number(Boolean(trOrigin));
  return n === 2 ? 'high' : n === 1 ? 'medium' : 'low';
}

/**
 * Source entries for one item. `ev` = `{ uz: {ru?, fa?, ar?}, tr: {…}, trText }`: for each language, whether the
 * Uzbek entry's / the Turkish partner's etymology reaches it. Order: ru, fa, ar.
 */
export function loanItemSources(row, ev) {
  const out = [];
  for (const lang of Object.keys(LOAN_LANGS)) {
    for (const text of row[lang]) {
      const uzOrigin = Boolean(ev.uz?.[lang]);
      const trOrigin = Boolean(ev.tr?.[lang]);
      const refs = [];
      if (uzOrigin) refs.push(`wiktionary:${row.lemma}`);
      if (trOrigin) refs.push(`wiktionary:${ev.trText}`);
      if (refs.length === 0) refs.push('curator:C3');
      out.push({
        lang,
        text,
        relation: LOAN_LANGS[lang],
        confidence: loanConfidence({ uzOrigin, trOrigin }),
        ref: refs.join('; '),
      });
    }
  }
  return out;
}

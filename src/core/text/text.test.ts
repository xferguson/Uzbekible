import { describe, expect, it } from 'vitest';
import {
  canonicalizeUz,
  cyrlToLatn,
  foldApostrophes,
  latnToCyrl,
  normalize,
  scriptMeta,
  toLetters,
  toLowerTr,
  toUpperTr,
} from './index.ts';

const O = 'oʻ';
const G = 'gʻ';
const T = 'ʼ';

describe('normalize', () => {
  it('composes to NFC', () => {
    expect(normalize('é')).toBe('é');
    expect(normalize('Й')).toBe('Й');
  });
});

describe('foldApostrophes', () => {
  it.each(["'", '‘', '’', '`', 'ʻ', 'ʼ'])('folds %j to a plain apostrophe', (c) => {
    expect(foldApostrophes(`o${c}zbek`)).toBe("o'zbek");
  });
  it('makes spelling variants compare equal', () => {
    expect(foldApostrophes(`b${O}lim`)).toBe(foldApostrophes("bo'lim"));
    expect(foldApostrophes(`ma${T}no`)).toBe(foldApostrophes('ma’no'));
  });
});

describe('canonicalizeUz', () => {
  it.each(["'", '‘', '’', '`', 'ʻ', 'ʼ'])('o/g + %j becomes U+02BB', (c) => {
    expect(canonicalizeUz(`bo${c}lim`)).toBe(`b${O}lim`);
    expect(canonicalizeUz(`g${c}or`)).toBe(`${G}or`);
  });
  it('uses U+02BC for tutuq', () => {
    expect(canonicalizeUz("ma'no")).toBe(`ma${T}no`);
    expect(canonicalizeUz('ma’no')).toBe(`ma${T}no`);
  });
  it('keeps capitals', () => {
    expect(canonicalizeUz("O'zbek G'ish")).toBe(`Oʻzbek Gʻish`);
    expect(canonicalizeUz("O'ZBEK")).toBe('OʻZBEK');
  });
  it('is NFC and leaves Cyrillic alone', () => {
    expect(canonicalizeUz('ўзбек')).toBe('ўзбек');
    expect(canonicalizeUz('Й')).toBe('Й');
  });
});

describe('Turkish case', () => {
  it('handles dotted and dotless i', () => {
    expect(toLowerTr('ISPARTA')).toBe('ısparta');
    expect(toLowerTr('İstanbul')).toBe('istanbul');
    expect(toUpperTr('ırmak')).toBe('IRMAK');
    expect(toUpperTr('istanbul')).toBe('İSTANBUL');
  });
});

describe('toLetters (uz-Latn)', () => {
  it('treats sh, ch, ng, oʻ, gʻ as single letters', () => {
    expect(toLetters('shahar', 'uz-Latn')).toEqual(['sh', 'a', 'h', 'a', 'r']);
    expect(toLetters('choy', 'uz-Latn')).toEqual(['ch', 'o', 'y']);
    expect(toLetters('sinf', 'uz-Latn')).toEqual(['s', 'i', 'n', 'f']);
    expect(toLetters('tong', 'uz-Latn')).toEqual(['t', 'o', 'ng']);
    expect(toLetters(`b${O}lim`, 'uz-Latn')).toEqual(['b', O, 'l', 'i', 'm']);
    expect(toLetters(`${G}ish`, 'uz-Latn')).toEqual([G, 'i', 'sh']);
  });
  it('recognises any apostrophe variant and keeps the original characters', () => {
    expect(toLetters("o'zbek", 'uz-Latn')).toEqual(["o'", 'z', 'b', 'e', 'k']);
    expect(toLetters('g‘or', 'uz-Latn')).toEqual(['g‘', 'o', 'r']);
  });
  it('is case-insensitive about digraphs', () => {
    expect(toLetters('SHahar', 'uz-Latn')[0]).toBe('SH');
    expect(toLetters('Shahar', 'uz-Latn')[0]).toBe('Sh');
    expect(toLetters(`O${'ʻ'}zbek`, 'uz-Latn')[0]).toBe(`O${'ʻ'}`);
  });
  it('keeps tutuq as its own letter and not part of o/g digraphs elsewhere', () => {
    expect(toLetters(`ma${T}no`, 'uz-Latn')).toEqual(['m', 'a', T, 'n', 'o']);
  });
  it('does not swallow the g of gʻ into ng', () => {
    expect(toLetters(`tong${'ʻ'}`, 'uz-Latn')).toEqual(['t', 'o', 'n', G]);
  });
  it('respects a zero-width non-joiner between s and h', () => {
    expect(toLetters('is‌haq', 'uz-Latn')).toEqual(['i', 's', 'h', 'a', 'q']);
  });
  it('returns [] for the empty string', () => {
    expect(toLetters('', 'uz-Latn')).toEqual([]);
  });
});

describe('toLetters (uz-Cyrl)', () => {
  it('splits by code point and keeps ў қ ғ ҳ', () => {
    expect(toLetters('ўқитувчи', 'uz-Cyrl')).toEqual(['ў', 'қ', 'и', 'т', 'у', 'в', 'ч', 'и']);
    expect(toLetters('ғазаб ҳақ', 'uz-Cyrl')).toContain('ғ');
    expect(toLetters('ҳақ', 'uz-Cyrl')).toEqual(['ҳ', 'а', 'қ']);
  });
  it('normalizes first so й is one letter', () => {
    expect(toLetters('й', 'uz-Cyrl')).toEqual(['й']);
  });
});

describe('latnToCyrl', () => {
  it.each([
    ['shahar', 'шаҳар'],
    ['choy', 'чой'],
    ['sinf', 'синф'],
    ['tong', 'тонг'],
    [`b${O}lim`, 'бўлим'],
    [`${G}isht`, 'ғишт'],
    [`ma${T}no`, 'маъно'],
    ['qalam', 'қалам'],
    ['hayot', 'ҳаёт'],
    ['yosh', 'ёш'],
    ['yulduz', 'юлдуз'],
    ['yaxshi', 'яхши'],
    ['yer', 'ер'],
    ['yil', 'йил'],
    ['joy', 'жой'],
    ['ertaga', 'эртага'],
    ['sevgi', 'севги'],
    ['maktab', 'мактаб'],
    ['tsement', 'цемент'],
    ['otsa', 'отса'],
    ['ketsa', 'кетса'],
  ])('%s → %s', (latn, cyrl) => {
    expect(latnToCyrl(latn)).toBe(cyrl);
  });
  it('accepts any apostrophe spelling', () => {
    expect(latnToCyrl("o'zbek")).toBe('ўзбек');
    expect(latnToCyrl("ma'no")).toBe('маъно');
  });
  it('writes e as э after a vowel', () => {
    expect(latnToCyrl('ae')).toBe('аэ');
  });
  it('follows capitalisation', () => {
    expect(latnToCyrl('Shahar')).toBe('Шаҳар');
    expect(latnToCyrl('SHAHAR')).toBe('ШАҲАР');
    expect(latnToCyrl("O'zbekiston")).toBe('Ўзбекистон');
    expect(latnToCyrl('Yosh')).toBe('Ёш');
    expect(latnToCyrl('YOSH')).toBe('ЁШ');
    expect(latnToCyrl('Tong')).toBe('Тонг');
    expect(latnToCyrl('TONG')).toBe('ТОНГ');
    expect(latnToCyrl('Ertaga')).toBe('Эртага');
  });
  it('passes through spaces, digits, punctuation and drops ZWNJ', () => {
    expect(latnToCyrl('bir, ikki 3-4!')).toBe('бир, икки 3-4!');
    expect(latnToCyrl('is‌haq')).toBe('исҳақ');
  });
  it('keeps n + gʻ apart from ng', () => {
    expect(latnToCyrl(`n${G}`)).toBe('нғ');
  });
});

describe('cyrlToLatn', () => {
  it.each([
    ['шаҳар', 'shahar'],
    ['чой', 'choy'],
    ['бўлим', `b${O}lim`],
    ['ғишт', `${G}isht`],
    ['маъно', `ma${T}no`],
    ['тонг', 'tong'],
    ['ёш', 'yosh'],
    ['юлдуз', 'yulduz'],
    ['яхши', 'yaxshi'],
    ['ер', 'yer'],
    ['йил', 'yil'],
    ['эртага', 'ertaga'],
    ['севги', 'sevgi'],
    ['цемент', 'tsement'],
    ['аэ', 'ae'],
    ['қалам', 'qalam'],
  ])('%s → %s', (cyrl, latn) => {
    expect(cyrlToLatn(cyrl)).toBe(latn);
  });
  it('follows capitalisation', () => {
    expect(cyrlToLatn('Шаҳар')).toBe('Shahar');
    expect(cyrlToLatn('ШАҲАР')).toBe('SHAHAR');
    expect(cyrlToLatn('Ўзбекистон')).toBe(`O${'ʻ'}zbekiston`);
    expect(cyrlToLatn('ЎЗБЕК')).toBe(`O${'ʻ'.toUpperCase()}ZBEK`);
    expect(cyrlToLatn('Ёш')).toBe('Yosh');
    expect(cyrlToLatn('ЁШ')).toBe('YOSH');
    expect(cyrlToLatn('Эртага')).toBe('Ertaga');
  });
  it('passes through other characters', () => {
    expect(cyrlToLatn('бир, икки 3-4!')).toBe('bir, ikki 3-4!');
  });
});

describe('scriptMeta', () => {
  it('describes each supported language', () => {
    expect(scriptMeta('uz-Latn')).toEqual({ dir: 'ltr', bcp47: 'uz-Latn', fontStack: 'var(--font-ui)' });
    expect(scriptMeta('uz-Cyrl')).toEqual({ dir: 'ltr', bcp47: 'uz-Cyrl', fontStack: 'var(--font-ui)' });
    expect(scriptMeta('tr')).toEqual({ dir: 'ltr', bcp47: 'tr', fontStack: 'var(--font-ui)' });
    expect(scriptMeta('ru')).toEqual({ dir: 'ltr', bcp47: 'ru', fontStack: 'var(--font-ui)' });
    expect(scriptMeta('fa')).toEqual({ dir: 'rtl', bcp47: 'fa', fontStack: 'var(--font-fa)' });
    expect(scriptMeta('ar')).toEqual({ dir: 'rtl', bcp47: 'ar', fontStack: 'var(--font-naskh)' });
  });
});

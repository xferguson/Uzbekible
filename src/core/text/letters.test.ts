import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { sourceLetters } from './index.ts';

describe('sourceLetters', () => {
  it('splits Turkish with Turkish casing', () => {
    expect(sourceLetters('İsim', 'tr')).toEqual(['i', 's', 'i', 'm']);
    expect(sourceLetters('IRMAK', 'tr')).toEqual(['ı', 'r', 'm', 'a', 'k']);
    expect(sourceLetters('çiçek şöyle ğüı', 'tr').slice(0, 3)).toEqual(['ç', 'i', 'ç']);
    expect(sourceLetters('çşğıöü', 'tr')).toHaveLength(6);
  });

  it('normalizes decomposed input to NFC first', () => {
    expect(sourceLetters('çay', 'tr')).toEqual(['ç', 'a', 'y']);
  });

  it('keeps ё distinct from е in Russian', () => {
    expect(sourceLetters('ЁЖ', 'ru')).toEqual(['ё', 'ж']);
    expect(sourceLetters('ее', 'ru')).toEqual(['е', 'е']);
    expect(sourceLetters('Мёд', 'ru')).toEqual(['м', 'ё', 'д']);
  });

  it('drops harakat and tatweel in Persian and Arabic, keeping logical order', () => {
    expect(sourceLetters('كِتَابٌ', 'ar')).toEqual(['ك', 'ت', 'ا', 'ب']);
    expect(sourceLetters('كـتاب', 'fa')).toEqual(['ك', 'ت', 'ا', 'ب']);
    expect(sourceLetters('كتٰاب', 'ar')).toEqual(['ك', 'ت', 'ا', 'ب']);
  });

  it('keeps hamza-carrying forms as written', () => {
    expect(sourceLetters('أإؤئآ', 'ar')).toEqual(['أ', 'إ', 'ؤ', 'ئ', 'آ']);
    expect(sourceLetters('آ', 'ar')).toEqual(['آ']);
    expect(sourceLetters('ٔ', 'ar')).toEqual([]);
  });

  it('round-trips and never yields empty or lone combining letters', () => {
    const marks = /[\u064B-\u065F\u0670\u0640]/gu;
    const word = (chars: string) => fc.string({ unit: fc.constantFrom(...chars), maxLength: 12 });
    const check = (lang: 'tr' | 'ru' | 'fa' | 'ar', w: string) => {
      const letters = sourceLetters(w, lang);
      const n = w.normalize('NFC');
      const expected =
        lang === 'fa' || lang === 'ar'
          ? n.replace(marks, '')
          : (lang === 'tr' ? n.toLocaleLowerCase('tr') : n.toLowerCase()).normalize('NFC');
      expect(letters.join('')).toBe(expected);
      for (const l of letters) {
        expect(l).not.toBe('');
        expect(/^\p{M}$/u.test(l)).toBe(false);
      }
    };
    fc.assert(fc.property(word('aIİçşğıöüc\u0327'), (w) => check('tr', `a${w}`)));
    fc.assert(fc.property(word('ЁЕжМд'), (w) => check('ru', w)));
    fc.assert(
      fc.property(word('كِتَـأآبءٰاٌ'), fc.constantFrom('fa', 'ar'), (w, l) => check(l, w)),
    );
  });
});

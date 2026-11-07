import { describe, expect, it } from 'vitest';
import { applyRules, bestMatch, distance, RULES, transparency } from './index';

describe('distance', () => {
  it('counts substitutions, insertions, deletions and adjacent transpositions as 1', () => {
    expect(distance('kitob', 'kitob')).toBe(0);
    expect(distance('qora', 'qara')).toBe(1);
    expect(distance('qora', 'qor')).toBe(1);
    expect(distance('qora', 'qoraa')).toBe(1);
    expect(distance('tosh', 'tsoh')).toBe(1);
  });
  it('treats digraphs and oʻ/gʻ as single letters', () => {
    expect(distance('shahar', 'sahar')).toBe(1);
    expect(distance('koʻz', 'koz')).toBe(1);
    expect(distance('togʻ', 'tog')).toBe(1);
  });
  it('ignores case and apostrophe spelling', () => {
    expect(distance("Ko'z", 'koʻz')).toBe(0);
    expect(distance('KOʻZ', 'koʻz')).toBe(0);
  });
  it('handles empty strings and Cyrillic', () => {
    expect(distance('', 'abc')).toBe(3);
    expect(distance('abc', '')).toBe(3);
    expect(distance('', '')).toBe(0);
    expect(distance('қора', 'кора', 'uz-Cyrl')).toBe(1);
  });
});

describe('applyRules', () => {
  it('applies mandatory orthography and optional sound shifts', () => {
    expect(applyRules('göz')).toContain('koʻz');
    expect(applyRules('gelmek')).toContain('kelmoq');
    expect(applyRules('kara')).toContain('qora');
    expect(applyRules('baş')).toContain('bosh');
    expect(applyRules('dağ')).toContain('togʻ');
    expect(applyRules('ver')).toContain('ber');
    expect(applyRules('üç')).toContain('uch');
    expect(applyRules('kız')).toContain('qiz');
    expect(applyRules('cevap')).toContain('javob');
  });
  it('is Turkish-case aware and returns unique, capped candidates', () => {
    expect(applyRules('GÖZ')).toContain('koʻz');
    expect(applyRules('Işık')).toContain('ishiq');
    const many = applyRules('karakalakakarakalakakara');
    expect(new Set(many).size).toBe(many.length);
    expect(many.length).toBeLessThanOrEqual(256);
    expect(applyRules('')).toEqual(['']);
  });
  it('keeps the unshifted form and the shifted form side by side', () => {
    expect(applyRules('kara')).toEqual(expect.arrayContaining(['qara', 'qora']));
    expect(applyRules('kitap')).toContain('kitob');
  });
  it('exposes rules as data with unique ids', () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('g>k-initial');
  });
});

describe('transparency', () => {
  it('scores regular cognates high', () => {
    expect(transparency('göz', 'koʻz')).toBe(1);
    expect(transparency('gelmek', 'kelmoq')).toBe(1);
    expect(transparency('kara', 'qora')).toBe(1);
  });
  it('scores irregular pairs low', () => {
    expect(transparency('ev', 'uy')).toBeLessThan(0.2);
    expect(transparency('ev', 'uy')).toBeLessThan(transparency('kara', 'qora'));
  });
  it('is partial for near matches and handles empties', () => {
    const t = transparency('kitap', 'kitob');
    expect(t).toBeGreaterThan(0.5);
    expect(t).toBeLessThan(1);
    expect(transparency('', '')).toBe(1);
    expect(transparency('ev', '')).toBe(0);
  });
});

describe('bestMatch', () => {
  const words = ['kitob', 'qalam', 'daftar'];
  it('returns the closest candidate within the threshold', () => {
    expect(bestMatch('kitop', words, 1)).toEqual({ value: 'kitob', index: 0, distance: 1 });
    expect(bestMatch('qalam', words, 0)).toEqual({ value: 'qalam', index: 1, distance: 0 });
  });
  it('returns undefined when nothing is close enough', () => {
    expect(bestMatch('maktab', words, 1)).toBeUndefined();
    expect(bestMatch('x', [], 5)).toBeUndefined();
  });
  it('breaks ties by first candidate and defaults to threshold 1', () => {
    expect(bestMatch('aa', ['ab', 'ac'])?.index).toBe(0);
    expect(bestMatch('kitoc', words)?.value).toBe('kitob');
  });
});

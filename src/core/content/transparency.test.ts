import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeItem } from './fixtures.ts';
import { LANGS, type Item } from './schema.ts';
import { itemTransparency } from './transparency.ts';

const src = (lang: Item['sources'][number]['lang'], text: string): Item['sources'][number] => ({
  lang,
  text,
  relation: 'turkic-cognate',
  confidence: 'high',
  ref: 'x',
});

describe('itemTransparency', () => {
  it('scores göz↔koʻz as 1 for tr', () => {
    expect(itemTransparency(makeItem())).toEqual({ tr: 1 });
  });
  it('is empty for an item with only a Russian source', () => {
    expect(itemTransparency(makeItem({ sources: [src('ru', 'стол')] }))).toEqual({});
  });
  it('takes the best score over several Turkish sources', () => {
    const t = itemTransparency(makeItem({ sources: [src('tr', 'ev'), src('tr', 'göz')] }));
    expect(t.tr).toBe(1);
  });
});

describe('itemTransparency (property)', () => {
  const sourceArb = fc.record({
    lang: fc.constantFrom(...LANGS),
    text: fc.string({ minLength: 1, maxLength: 8 }),
  });
  it('stays in [0, 1] and only names languages present in sources', () => {
    fc.assert(
      fc.property(fc.array(sourceArb, { maxLength: 4 }), (raw) => {
        const item = makeItem({ sources: raw.map((s) => src(s.lang, s.text)) });
        const t = itemTransparency(item);
        for (const [lang, v] of Object.entries(t)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
          expect(item.sources.some((s) => s.lang === lang)).toBe(true);
        }
      }),
    );
  });
});

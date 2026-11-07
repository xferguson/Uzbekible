import { describe, expect, it } from 'vitest';
import { makeItem } from './fixtures';
import { ItemSchema, type Item } from './schema';
import { boardPool, validateItems, type IssueCode } from './validate';
import { buildPack, serializePack } from './build';
import { loadItems } from './load';
import { itemConfidence, renderReview } from './review';

const codes = (items: unknown[]): IssueCode[] => validateItems(items).issues.map((i) => i.code);
const src = (over: Partial<Item['sources'][number]>): Item['sources'] => [
  { ...makeItem().sources[0]!, ...over },
];

describe('ItemSchema', () => {
  it('accepts a valid item and derives the type', () => {
    expect(ItemSchema.parse(makeItem())).toEqual(makeItem());
  });
  it('rejects unknown keys and bad enums', () => {
    expect(ItemSchema.safeParse({ ...makeItem(), extra: 1 }).success).toBe(false);
    expect(ItemSchema.safeParse({ ...makeItem(), form: 'stem' }).success).toBe(false);
  });
});

describe('validateItems: each fault gives its own error', () => {
  it('a clean item has no issues', () => {
    expect(validateItems([makeItem()])).toEqual({ issues: [], items: [makeItem()] });
  });
  it('reports schema violations with the item id', () => {
    const r = validateItems([{ ...makeItem(), glossEn: '' }]);
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0]).toMatchObject({ code: 'schema', id: 'uz-koz', severity: 'error' });
    expect(r.items).toEqual([]);
  });
  it('reports a missing Cyrillic form', () => {
    expect(codes([makeItem({ uz: { latn: 'koʻz', cyrl: '' } })])).toContain('uz-cyrl-missing');
    expect(codes([makeItem({ uz: { latn: 'koʻz', cyrl: 'koz' } })])).toContain('uz-cyrl-missing');
  });
  it('reports a missing Latin form', () => {
    expect(codes([makeItem({ uz: { latn: 'кўз', cyrl: 'кўз' } })])).toContain('uz-latn-missing');
  });
  it('flags (as a warning) Cyrillic that differs from the transliteration', () => {
    const r = validateItems([makeItem({ uz: { latn: 'koʻz', cyrl: 'коз' } })]);
    expect(r.issues).toEqual([
      expect.objectContaining({ code: 'cyrl-mismatch', severity: 'warning' }),
    ]);
    expect(r.items).toHaveLength(1);
  });
  it('reports duplicate ids', () => {
    expect(codes([makeItem(), makeItem()])).toEqual(['duplicate-id']);
  });
  it('reports non-canonical apostrophes', () => {
    expect(codes([makeItem({ uz: { latn: "ko'z", cyrl: 'кўз' } })])).toContain('apostrophe');
  });
  it('requires Latin script for Turkish and Cyrillic for Russian', () => {
    expect(codes([makeItem({ sources: src({ text: 'гөз' }) })])).toContain('source-script');
    expect(codes([makeItem({ sources: src({ lang: 'ru', text: 'glaz' }) })])).toContain(
      'source-script',
    );
    expect(
      codes([makeItem({ sources: src({ lang: 'ru', text: 'глаз', relation: 'russian-loan' }) })]),
    ).toEqual([]);
  });
  it('requires Arabic script for Persian and Arabic', () => {
    expect(codes([makeItem({ sources: src({ lang: 'fa', text: 'chashm' }) })])).toContain(
      'source-script',
    );
    expect(
      codes([makeItem({ sources: src({ lang: 'ar', text: 'عين', relation: 'arabic-loan' }) })]),
    ).toEqual([]);
    expect(
      codes([makeItem({ sources: src({ lang: 'fa', text: 'چشم', relation: 'persian-loan' }) })]),
    ).toEqual([]);
  });
  it('requires a lemma for inflected items, pointing at a known id', () => {
    expect(codes([makeItem({ form: 'inflected' })])).toContain('lemma-missing');
    expect(codes([makeItem({ form: 'inflected', lemma: 'uz-yoq' })])).toContain('lemma-unknown');
    const ok = [
      makeItem(),
      makeItem({ id: 'uz-kozda', form: 'inflected', lemma: 'uz-koz', suffixes: ['-da'] }),
    ];
    expect(codes(ok)).toEqual([]);
  });
  it('rejects ids that are not kebab-case uz- ids', () => {
    expect(codes([makeItem({ id: 'Koz' })])).toContain('bad-id');
  });
  it('lists a source without a real ref as a warning when confidence is above low', () => {
    const r = validateItems([makeItem({ sources: src({ ref: 'curator:C2' }) })]);
    expect(r.issues.map((i) => i.severity)).not.toContain('error');
  });
  it('keeps false friends out of board pools', () => {
    const ff = makeItem({ sources: src({ relation: 'false-friend' }), tags: ['pool:juft'] });
    expect(codes([ff])).toEqual(['false-friend-in-pool']);
    expect(codes([{ ...ff, tags: [] }])).toEqual([]);
    expect(
      boardPool([ff, makeItem({ id: 'uz-b' }), makeItem({ id: 'uz-c', deprecated: true })]).map(
        (i) => i.id,
      ),
    ).toEqual(['uz-b']);
  });
});

describe('buildPack / serializePack', () => {
  const a = makeItem({ id: 'uz-a', freqRank: 2 });
  const b = makeItem({ id: 'uz-b', freqRank: 1 });
  const c = makeItem({ id: 'uz-c', freqRank: 2 });
  it('orders by frequency rank then id and tags version 1', () => {
    expect(buildPack([c, a, b]).items.map((i) => i.id)).toEqual(['uz-b', 'uz-a', 'uz-c']);
    expect(buildPack([a]).version).toBe(1);
  });
  it('is byte-stable for any input order', () => {
    expect(serializePack(buildPack([a, b, c]))).toBe(serializePack(buildPack([c, b, a])));
    expect(serializePack(buildPack([a])).endsWith('\n')).toBe(true);
  });
  it('omits transparency without a scorer and computes it with one', () => {
    expect(buildPack([a]).items[0]).not.toHaveProperty('transparency');
    const p = buildPack([a], { transparency: (it) => ({ tr: it.sources.length / 2 }) });
    expect(p.items[0]?.transparency).toEqual({ tr: 0.5 });
  });
  it('does not mutate its input', () => {
    const input = [c, a, b];
    buildPack(input, { transparency: () => ({ tr: 1 }) });
    expect(input.map((i) => i.id)).toEqual(['uz-c', 'uz-a', 'uz-b']);
    expect(c).not.toHaveProperty('transparency');
  });
});

describe('loadItems', () => {
  it('round-trips a serialized pack', () => {
    const pack = buildPack([makeItem()]);
    expect(loadItems(JSON.parse(serializePack(pack)))).toEqual(pack.items);
  });
  it('throws on a wrong version or invalid item', () => {
    expect(() => loadItems({ version: 2, items: [] })).toThrow();
    expect(() => loadItems({ version: 1, items: [{ id: 'x' }] })).toThrow();
  });
});

describe('renderReview', () => {
  const hi = makeItem({ id: 'uz-hi' });
  const lo = makeItem({ id: 'uz-lo', sources: src({ confidence: 'low', ref: 'curator:C2' }) });
  const md = renderReview(
    [hi, lo],
    [{ code: 'cyrl-mismatch', severity: 'warning', id: 'uz-lo', message: 'm' }],
  );
  it('groups by confidence, lowest first', () => {
    expect(md.indexOf('## Low')).toBeGreaterThan(-1);
    expect(md.indexOf('## Low')).toBeLessThan(md.indexOf('## High'));
    expect(md.indexOf('uz-lo')).toBeLessThan(md.indexOf('uz-hi'));
  });
  it('lists validator warnings and counts', () => {
    expect(md).toContain('cyrl-mismatch');
    expect(md).toContain('2 items');
  });
  it('is deterministic', () => {
    expect(renderReview([lo, hi], [])).toBe(renderReview([hi, lo], []));
  });
});

describe('edge cases', () => {
  it('names schema failures for non-objects and items without a string id', () => {
    const r = validateItems([null, { id: 7 }]);
    expect(r.issues.map((i) => i.id)).toEqual(['(item #0)', '(item #1)']);
  });
  it('sorts equal ranks by id in both directions', () => {
    const ids = (xs: Item[]) => buildPack(xs).items.map((i) => i.id);
    const lo = makeItem({ id: 'uz-a' });
    const hi = makeItem({ id: 'uz-b' });
    expect(ids([lo, hi])).toEqual(['uz-a', 'uz-b']);
    expect(ids([hi, lo])).toEqual(['uz-a', 'uz-b']);
    expect(ids([lo, makeItem({ id: 'uz-a' })])).toEqual(['uz-a', 'uz-a']);
  });
  it('rates an item by its weakest source; no sources is low', () => {
    const mixed = makeItem({ sources: [...src({}), ...src({ confidence: 'medium' })] });
    expect(itemConfidence(mixed)).toBe('medium');
    expect(itemConfidence(makeItem({ sources: [] }))).toBe('low');
    expect(itemConfidence(makeItem())).toBe('high');
  });
  it('escapes pipes, shows dashes for no sources, and handles empty groups', () => {
    const md = renderReview(
      [
        makeItem({ id: 'uz-p', glossEn: 'a|b', sources: [] }),
        makeItem({ id: 'uz-q', sources: src({ confidence: 'medium' }) }),
      ],
      [
        { code: 'weak-ref', severity: 'warning', id: 'uz-z', message: 'x' },
        { code: 'cyrl-mismatch', severity: 'warning', id: 'uz-y', message: 'y' },
        { code: 'cyrl-mismatch', severity: 'warning', id: 'uz-x', message: 'z' },
        { code: 'apostrophe', severity: 'error', id: 'uz-e', message: 'e' },
      ],
    );
    expect(md).toContain('a\\|b');
    expect(md).toContain('| — | — |');
    expect(md).toContain('## High confidence (0)');
    expect(md.indexOf('uz-x')).toBeLessThan(md.indexOf('uz-y'));
    expect(md).not.toContain('uz-e:');
  });
});

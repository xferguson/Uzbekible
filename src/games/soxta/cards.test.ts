import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  boardPool,
  ItemSchema,
  validateItems,
  type Item,
  type SourceForm,
} from '@core/content/index.ts';
import { loadItems } from '@core/content/index.ts';
import { makeItem } from '@core/content/fixtures.ts';
import { soxtaPool, tierOf } from './cards.ts';

const ff = (over: Partial<SourceForm> = {}): SourceForm => ({
  lang: 'tr',
  text: 'hat',
  relation: 'false-friend',
  confidence: 'medium',
  ref: 'wiktionary:hat',
  ...over,
});
const falseFriend = (id: string, over: Partial<Item> = {}): Item =>
  makeItem({ id, glossEn: 'letter', sources: [ff()], ...over });

describe('soxtaPool', () => {
  it('returns exactly the false friend from a mixed fixture', () => {
    const cognate = makeItem({ id: 'uz-koz' });
    const friend = falseFriend('uz-xat');
    const cards = soxtaPool([cognate, friend]);
    expect(cards.map((c) => c.id)).toEqual(['uz-xat']);
    expect(cards[0]).toMatchObject({
      uz: friend,
      other: { lang: 'tr', text: 'hat' },
      clues: { uz: 'letter' },
    });
    expect(cards[0]?.clues.other).toBeUndefined();
  });

  it('carries the Turkish gloss as the other-side clue when present', () => {
    const [card] = soxtaPool([
      falseFriend('uz-xat', { sources: [ff({ glossEn: 'hat (headwear)' })] }),
    ]);
    expect(card?.clues.other).toBe('hat (headwear)');
  });

  it('excludes deprecated items, non-Turkish false friends and items without a gloss', () => {
    const items = [
      falseFriend('uz-a', { deprecated: true }),
      falseFriend('uz-b', { sources: [ff({ lang: 'ru', text: 'шляпа' })] }),
      falseFriend('uz-c', { glossEn: '' }),
    ];
    expect(soxtaPool(items)).toEqual([]);
  });

  it('excludes partial false friends (flag or ref marker)', () => {
    const items = [
      falseFriend('uz-a', { sources: [ff({ partial: true })] }),
      falseFriend('uz-b', { sources: [ff({ ref: 'curator:partial; wiktionary:x' })] }),
    ];
    expect(soxtaPool(items)).toEqual([]);
  });

  it('uses the first Turkish false-friend source when an item has several sources', () => {
    const [card] = soxtaPool([
      falseFriend('uz-a', {
        sources: [ff({ lang: 'ar', text: 'خط', relation: 'arabic-loan' }), ff({ text: 'hat' })],
      }),
    ]);
    expect(card?.other).toEqual({ lang: 'tr', text: 'hat' });
  });

  it('assigns tiers by frequency rank, easiest first', () => {
    expect(tierOf(1)).toBe(1);
    expect(tierOf(300)).toBe(1);
    expect(tierOf(301)).toBe(2);
    expect(tierOf(600)).toBe(2);
    expect(tierOf(601)).toBe(3);
  });

  it('is disjoint from boardPool for any items (property)', () => {
    const srcArb = fc.record({
      relation: fc.constantFrom('false-friend' as const, 'turkic-cognate' as const),
      lang: fc.constantFrom('tr' as const, 'ru' as const),
      partial: fc.boolean(),
    });
    const itemArb = fc
      .record({
        n: fc.nat(500),
        deprecated: fc.boolean(),
        gloss: fc.constantFrom('', 'eye'),
        sources: fc.array(srcArb, { maxLength: 3 }),
      })
      .map(({ n, deprecated, gloss, sources }) =>
        makeItem({
          id: `uz-w${n}`,
          deprecated,
          glossEn: gloss,
          sources: sources.map((s) => ff({ ...s })),
        }),
      );
    fc.assert(
      fc.property(fc.uniqueArray(itemArb, { selector: (i) => i.id }), (items) => {
        const board = new Set(boardPool(items).map((i) => i.id));
        for (const c of soxtaPool(items)) expect(board.has(c.id)).toBe(false);
      }),
    );
  });
});

describe('source glossEn schema', () => {
  it('accepts an optional non-empty glossEn and the partial flag', () => {
    const item = makeItem({ sources: [ff({ glossEn: 'letter', partial: true })] });
    expect(ItemSchema.safeParse(item).success).toBe(true);
    expect(validateItems([item]).issues.filter((i) => i.severity === 'error')).toEqual([]);
  });
  it('rejects an empty source glossEn', () => {
    const item = makeItem({ sources: [ff({ glossEn: '  ' })] });
    expect(validateItems([item]).issues.some((i) => i.code === 'schema')).toBe(true);
  });
});

describe('shipped Soxta content', () => {
  const pool = soxtaPool(
    loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8'))),
  );

  it('has a pool to play', () => {
    expect(pool.length).toBeGreaterThan(50);
  });
  // Without it the reveal shows the Turkish word with no English meaning, and no Turkish-meaning clues are dealt.
  it('gives every card an English meaning for the Turkish word', () => {
    expect(pool.filter((c) => !c.clues.other).map((c) => c.id)).toEqual([]);
  });
  it('never gives the two words the same English meaning', () => {
    const same = pool.filter((c) => c.clues.other?.toLowerCase() === c.clues.uz.toLowerCase());
    expect(same.map((c) => c.id)).toEqual([]);
  });
});

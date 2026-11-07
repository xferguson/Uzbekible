import { describe, expect, it } from 'vitest';
import type { Aggregate } from '../learning-log/index.ts';
import { makeItem } from '../content/fixtures.ts';
import { createRng } from '../random/index.ts';
import { masteryOf, nextItems } from './index.ts';

const item = (id: string, freqRank: number, lang: 'tr' | 'ru' = 'tr') =>
  makeItem({
    id,
    freqRank,
    sources: [{ lang, text: id, relation: 'turkic-cognate', confidence: 'high', ref: 'x' }],
  });

const agg = (
  itemId: string,
  attempts: number,
  correct: number,
  sourceLang: 'tr' | 'ru' = 'tr',
): Aggregate => ({
  itemId,
  sourceLang,
  relation: 'turkic-cognate',
  attempts,
  correct,
  meanRtMs: 1000,
});

describe('false friends', () => {
  it('never returns an item with a false-friend source', () => {
    const ff = makeItem({
      id: 'uz-ff',
      freqRank: 1,
      sources: [{ lang: 'tr', text: 'x', relation: 'false-friend', confidence: 'high', ref: 'x' }],
    });
    const pool = [ff, item('uz-a', 2), item('uz-b', 3)];
    const out = nextItems(pool, [], 3, createRng(1));
    expect(out.map((i) => i.id)).not.toContain('uz-ff');
    expect(out).toHaveLength(2);
  });
});

const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('masteryOf', () => {
  it('is 0.5 for unseen items (Laplace prior)', () => {
    expect(masteryOf([])).toBe(0.5);
  });
  it('is (correct+1)/(attempts+2), pooled over aggregates', () => {
    expect(masteryOf([agg('a', 3, 3), agg('a', 1, 0, 'ru')])).toBeCloseTo(4 / 6);
  });
  it('drops with misses', () => {
    expect(masteryOf([agg('a', 4, 0)])).toBeCloseTo(1 / 6);
  });
});

describe('nextItems', () => {
  const pool = [item('d', 4), item('a', 1), item('c', 3), item('b', 2)];

  it('serves unseen items in frequency order', () => {
    expect(ids(nextItems(pool, [], 3, createRng(1)))).toEqual(['a', 'b', 'c']);
  });

  it('re-shows a missed item within the next level', () => {
    const out = nextItems(pool, [agg('c', 2, 0)], 3, createRng(1), { reviewRatio: 0.34 });
    expect(ids(out)).toContain('c');
    expect(out).toHaveLength(3);
  });

  it('skips items already answered correctly while new ones remain', () => {
    const out = nextItems(pool, [agg('a', 3, 3)], 2, createRng(1));
    expect(ids(out)).toEqual(['b', 'c']);
  });

  it('fills with seen items (lowest mastery first) when new ones run out', () => {
    const history = [agg('a', 3, 3), agg('b', 3, 3), agg('c', 3, 1), agg('d', 3, 3)];
    const out = nextItems(pool, history, 4, createRng(1), { reviewRatio: 0 });
    expect(ids(out)[0]).toBe('c');
    expect(out).toHaveLength(4);
  });

  it('with reviewRatio 0 never prefers missed items over new ones', () => {
    const out = nextItems(pool, [agg('d', 2, 0)], 2, createRng(1), { reviewRatio: 0 });
    expect(ids(out)).toEqual(['a', 'b']);
  });

  it('respects the enabled source language filter', () => {
    const mixed = [item('a', 1, 'ru'), item('b', 2, 'tr'), item('c', 3, 'tr')];
    const out = nextItems(mixed, [], 3, createRng(1), { enabledLangs: ['tr'] });
    expect(ids(out)).toEqual(['b', 'c']);
  });

  it('ignores history rows from disabled languages', () => {
    const mixed = [item('a', 1), item('b', 2)];
    const out = nextItems(mixed, [agg('b', 2, 0, 'ru')], 1, createRng(1), {
      enabledLangs: ['tr'],
      reviewRatio: 1,
    });
    expect(ids(out)).toEqual(['a']);
  });

  it('never returns deprecated items', () => {
    const p = [{ ...item('a', 1), deprecated: true }, item('b', 2)];
    expect(ids(nextItems(p, [], 5, createRng(1)))).toEqual(['b']);
  });

  it('handles n <= 0 and rejects bad ratios', () => {
    expect(nextItems(pool, [], 0, createRng(1))).toEqual([]);
    expect(() => nextItems(pool, [], 1, createRng(1), { reviewRatio: 2 })).toThrow(RangeError);
  });
});

describe('nextItems tie-breaking', () => {
  it('orders equal-frequency items by id regardless of pool order', () => {
    const pool = [item('b', 1), item('c', 1), item('a', 1)];
    const rng = createRng(1);
    expect(ids(nextItems(pool, [], 3, rng, { reviewRatio: 0 }))).toEqual(['a', 'b', 'c']);
    expect(ids(nextItems([...pool].reverse(), [], 3, createRng(1), { reviewRatio: 0 }))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

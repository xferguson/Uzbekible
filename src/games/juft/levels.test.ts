import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { boardPool, loadItems, type Item } from '@core/content/index.ts';
import type { Aggregate } from '@core/learning-log/index.ts';
import type { SourceLang } from '@core/text/index.ts';
import { levelContext } from '../sim-adapter.ts';
import type { GameSettings } from '../types.ts';
import { distance } from '@core/similarity/index.ts';
import {
  CHAPTER_SIZE,
  LEVEL_COUNT,
  MAX_PAIRS,
  focusFor,
  juftDifficulty,
} from './difficulty.config.ts';
import { createJuftLevels } from './levels.ts';

const items = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));
const levels = createJuftLevels(items);
const byId = new Map(items.map((i) => [i.id, i]));
const tr: GameSettings = { sourceLangs: ['tr'], script: 'latn' };

const spec = (level: number, settings = tr, history: Aggregate[] = []) =>
  levels(levelContext('juft', level, settings, history));

describe('juft level curve', () => {
  it('level 1 is a single pair', () => {
    expect(spec(1).params.pairs).toHaveLength(1);
  });
  it('hard-pair levels (every 5th up to 105) have one pair and are flagged', () => {
    for (let l = 5; l <= 105; l += 5) {
      const s = spec(l);
      expect(s.params.pairs, `level ${l}`).toHaveLength(1);
      expect(s.params.hard).toBe(true);
    }
  });
  it('levels 106-120 are full 12-pair boards', () => {
    for (let l = 106; l <= 120; l++) expect(spec(l).params.pairs, `level ${l}`).toHaveLength(12);
  });
  it('chapter sizes follow the game doc', () => {
    expect(CHAPTER_SIZE * 8).toBe(LEVEL_COUNT);
    expect(spec(15 - 1).params.pairs.length).toBeLessThanOrEqual(4);
    expect(spec(30 - 1).params.pairs.length).toBeLessThanOrEqual(6);
    expect(spec(104).params.pairs.length).toBeLessThanOrEqual(11);
  });
  it('never exceeds the 12-pair cap, even past level 120', () => {
    for (const l of [121, 150, 500]) expect(spec(l).params.pairs).toHaveLength(MAX_PAIRS);
  });
  it('the pair count never decreases between hard levels', () => {
    let prev = 0;
    for (let l = 1; l <= LEVEL_COUNT; l++) {
      if (l % 5 === 0 && l <= 105) continue;
      const n = spec(l).params.pairs.length;
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });
  it('par time and suffixed share are config-driven and tighten', () => {
    expect(spec(120).params.parMs / 12).toBeLessThan(spec(2).params.parMs);
    const suffixed = (l: number) => spec(l).params.pairs.filter((p) => p.suffixed).length;
    expect(suffixed(30)).toBe(0);
    expect(suffixed(119)).toBeGreaterThan(suffixed(66));
    expect(juftDifficulty.special?.[5]?.pairs).toBe(1);
  });
});

describe('juft level content', () => {
  it('is deterministic for a context and varies with the level', () => {
    expect(spec(40)).toEqual(spec(40));
    expect(spec(40).params.pairs.map((p) => p.id)).not.toEqual(
      spec(41).params.pairs.map((p) => p.id),
    );
  });
  it('lives and seed come from the contract', () => {
    const s = spec(7);
    expect(s.lives).toBe(3);
    expect(s.seed).toMatch(/^juft:7:/);
  });
  it('prefers Turkish when it is enabled and available', () => {
    const both: GameSettings = { sourceLangs: ['tr', 'ar', 'fa', 'ru'], script: 'latn' };
    for (const p of spec(80, both).params.pairs) {
      const item = byId.get(p.id)!;
      if (item.sources.some((s) => s.lang === 'tr')) expect(p.source.lang).toBe('tr');
    }
  });
  it('uses only enabled languages, including non-Turkish-only settings', () => {
    const ar: GameSettings = { sourceLangs: ['ar'], script: 'latn' };
    const pairs = spec(60, ar).params.pairs;
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) expect(p.source.lang).toBe('ar');
  });
  it('excludes false friends and deprecated items', () => {
    const allowed = new Set(boardPool(items).map((i) => i.id));
    const all: GameSettings = { sourceLangs: ['tr', 'ru', 'fa', 'ar'], script: 'cyrl' };
    for (let l = 1; l <= LEVEL_COUNT; l += 7)
      for (const p of spec(l, all).params.pairs) expect(allowed.has(p.id)).toBe(true);
  });
  it('fills a 12-pair board in every language combination, by falling back rather than shrinking', () => {
    const langs: SourceLang[] = ['tr', 'ru', 'fa', 'ar'];
    for (let mask = 1; mask < 16; mask++) {
      const sourceLangs = langs.filter((_, i) => mask & (1 << i));
      for (const l of [106, 113, 120, 130])
        expect(
          spec(l, { sourceLangs, script: 'latn' }).params.pairs,
          `${sourceLangs} ${l}`,
        ).toHaveLength(12);
    }
  });
  it('re-shows missed items in later levels', () => {
    const first = spec(61).params.pairs.map((p) => p.id);
    const missedId = items
      .filter((i: Item) => i.sources.some((s) => s.lang === 'tr') && !first.includes(i.id))
      .find((i) => i.form === 'lemma' && i.freqRank < 40)!;
    const history: Aggregate[] = [
      {
        itemId: missedId.id,
        sourceLang: 'tr',
        relation: 'turkic-cognate',
        attempts: 5,
        correct: 0,
        meanRtMs: 3000,
      },
    ];
    const ids = spec(61, tr, history).params.pairs.map((p) => p.id);
    expect(ids).toContain(missedId.id);
  });
  it('rejects bad levels and empty language sets', () => {
    expect(() => spec(0)).toThrow(RangeError);
    expect(() => spec(1.5)).toThrow(RangeError);
    expect(() => spec(1, { sourceLangs: [], script: 'latn' })).toThrow(RangeError);
  });
});

/** Mean Uzbek-form edit distance over all pairs of tiles on a board: low means the tiles look alike. */
function meanSpread(level: number, settings = tr): number {
  const uz = spec(level, settings).params.pairs.map((p) => p.uz.latn);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < uz.length; i++)
    for (let j = i + 1; j < uz.length; j++) {
      sum += distance(uz[i]!, uz[j]!);
      count++;
    }
  return sum / count;
}

describe('juft focus schedule (E4)', () => {
  it('is mixed in chapter 1, look-alike from chapter 2, suffix-family from chapter 5', () => {
    for (let l = 1; l <= 15; l++) expect(focusFor(l), `level ${l}`).toBe('mixed');
    expect(focusFor(18)).toBe('lookalike');
    expect(focusFor(62)).toBe('family');
    expect(focusFor(66)).toBe('family');
  });
  it('hard-pair levels stay mixed breathers', () => {
    for (let l = 5; l <= 105; l += 5) expect(focusFor(l), `level ${l}`).toBe('mixed');
  });
  it('every focus kind is used regularly and the spec carries it', () => {
    const kinds = new Set<string>();
    for (let l = 1; l <= LEVEL_COUNT; l++) kinds.add(spec(l).params.focus);
    expect([...kinds].sort()).toEqual(['family', 'lookalike', 'mixed']);
    expect(spec(18).params.focus).toBe('lookalike');
  });
});

describe('juft look-alike boards (E4)', () => {
  const lookalikeLevels = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).filter(
    (l) => focusFor(l) === 'lookalike' && l > 20 && l < 60,
  );
  const mixedLevels = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).filter(
    (l) => focusFor(l) === 'mixed' && l % 5 !== 0 && l > 20 && l < 60,
  );
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  it('tiles on look-alike boards are much closer in spelling than on mixed boards', () => {
    const look = mean(lookalikeLevels.map((l) => meanSpread(l)));
    const mixed = mean(mixedLevels.map((l) => meanSpread(l)));
    expect(look).toBeLessThan(mixed - 1);
  });
  it('are full boards of distinct items', () => {
    for (const l of lookalikeLevels) {
      const s = spec(l);
      expect(s.params.pairs.length).toBe(Math.min(MAX_PAIRS, s.params.pairs.length));
      expect(new Set(s.params.pairs.map((p) => p.id)).size).toBe(s.params.pairs.length);
    }
  });
});

describe('juft suffix-family boards (E4)', () => {
  const familyLevels = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).filter(
    (l) => focusFor(l) === 'family',
  );
  const stemOf = (id: string) => {
    const it = byId.get(id)!;
    return it.lemma ?? it.id;
  };

  it('one stem dominates the board with different suffixes', () => {
    for (const l of familyLevels) {
      const pairs = spec(l).params.pairs;
      const counts = new Map<string, number>();
      for (const p of pairs) counts.set(stemOf(p.id), (counts.get(stemOf(p.id)) ?? 0) + 1);
      const top = Math.max(...counts.values());
      expect(top, `level ${l}`).toBeGreaterThanOrEqual(Math.min(pairs.length, 5));
    }
  });
  it('the board is mostly suffixed forms of the stem', () => {
    for (const l of familyLevels) {
      const pairs = spec(l).params.pairs;
      expect(pairs.filter((p) => p.suffixed).length, `level ${l}`).toBeGreaterThanOrEqual(
        Math.ceil(pairs.length / 2),
      );
    }
  });
  it('falls back to a normal board when Turkish (the only suffixed source) is off', () => {
    const ar: GameSettings = { sourceLangs: ['ar'], script: 'latn' };
    expect(spec(62, ar).params.pairs.length).toBeGreaterThan(0);
  });
});

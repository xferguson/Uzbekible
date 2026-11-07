import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadItems, type Item } from '@core/content/index.ts';
import { makeItem } from '@core/content/fixtures.ts';
import type { Aggregate } from '@core/learning-log/index.ts';
import { levelContext } from '../sim-adapter.ts';
import type { GameSettings } from '../types.ts';
import { imloDifficulty } from './difficulty.config.ts';
import { createImloLevels, type ImloPair } from './levels.ts';

const real = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));
const trLatn: GameSettings = { sourceLangs: ['tr'], script: 'latn' };

const ism = makeItem({
  id: 'uz-ism',
  uz: { latn: 'ism', cyrl: 'исм' },
  glossEn: 'name',
  freqRank: 100,
  sources: [{ lang: 'tr', text: 'isim', relation: 'turkic-cognate', confidence: 'high', ref: 'x' }],
});

const run = (
  items: readonly Item[],
  level = 1,
  mode = 'oson',
  settings = trLatn,
  history: Aggregate[] = [],
) => createImloLevels(items)(levelContext('imlo', level, settings, history, mode));

const sorted = (xs: readonly string[]) => [...xs].sort();

describe('imlo pairs', () => {
  it('ism <-> isim gives the bank i i i s s m m in Oson', () => {
    const [pair] = run([ism]).params.pairs;
    expect(pair).toMatchObject({
      itemId: 'uz-ism',
      clue: 'name',
      source: { lang: 'tr', text: 'isim', letters: ['i', 's', 'i', 'm'] },
      uz: { text: 'ism', letters: ['i', 's', 'm'] },
    });
    expect(sorted(pair!.bank.map((t) => t.letter))).toEqual(sorted([...'iiissmm']));
    expect(new Set(pair!.bank.map((t) => t.id)).size).toBe(7);
    expect(pair!.bank.filter((t) => t.origin === 'source')).toHaveLength(4);
    expect(pair!.bank.filter((t) => t.origin === 'uz')).toHaveLength(3);
  });

  it('shows Uzbek in the player script, with the same tile count', () => {
    const latn = run([ism]).params.pairs[0]!;
    const cyrl = run([ism], 1, 'oson', { ...trLatn, script: 'cyrl' }).params.pairs[0]!;
    expect(cyrl.uz.letters).toEqual([...'исм']);
    expect(cyrl.uz.letters).toHaveLength(latn.uz.letters.length);
  });

  it('excludes multi-word, hyphenated, long and identical pairs', () => {
    const src = (text: string) => [
      {
        lang: 'tr' as const,
        text,
        relation: 'turkic-cognate' as const,
        confidence: 'high' as const,
        ref: 'x',
      },
    ];
    const bad = [
      makeItem({ id: 'uz-a', uz: { latn: 'bir ikki', cyrl: 'бир икки' }, sources: src('bir iki') }),
      makeItem({ id: 'uz-b', uz: { latn: 'ab-cd', cyrl: 'аб-цд' }, sources: src('abcd') }),
      makeItem({
        id: 'uz-c',
        uz: { latn: 'abcdefghi', cyrl: 'абцдефгхи' },
        sources: src('abcdefghi'),
      }),
      makeItem({ id: 'uz-d', uz: { latn: 'bu', cyrl: 'бу' }, sources: src('bu') }),
      makeItem({ id: 'uz-e', uz: { latn: 'yo', cyrl: 'ё' }, sources: src('yok') }),
    ];
    const ids = run([...bad, ism], 1).params.pairs.map((p) => p.itemId);
    expect(sorted(ids)).toEqual(['uz-e', 'uz-ism']);
  });

  it('is deterministic for a context and differs between modes', () => {
    expect(run(real, 7)).toEqual(run(real, 7));
    expect(run(real, 7, 'qiyin').seed).not.toBe(run(real, 7, 'oson').seed);
  });

  it('missed items resurface', () => {
    const history: Aggregate[] = real.slice(400, 440).map((i) => ({
      itemId: i.id,
      sourceLang: 'tr',
      relation: 'turkic-cognate',
      attempts: 4,
      correct: 0,
      meanRtMs: 5000,
    }));
    const base = run(real, 1).params.pairs.map((p) => p.itemId);
    const withHistory = run(real, 1, 'oson', trLatn, history).params.pairs.map((p) => p.itemId);
    const missed = new Set(history.map((h) => h.itemId));
    expect(withHistory.filter((id) => missed.has(id)).length).toBeGreaterThan(
      base.filter((id) => missed.has(id)).length,
    );
  });
});

describe('imlo curve', () => {
  it('follows the game doc: pairs and letter ranges per chapter', () => {
    const span = (level: number) => run(real, level).params.pairs;
    expect(span(1)).toHaveLength(5);
    expect(span(60)).toHaveLength(8);
    for (const p of span(3)) {
      expect(p.source.letters.length).toBeLessThanOrEqual(4);
      expect(p.uz.letters.length).toBeLessThanOrEqual(4);
    }
    expect(imloDifficulty.params.distractors).toBeDefined();
  });

  it('Oson and Oʻrta have no distractors; Qiyin has 2 rising to 4', () => {
    const count = (level: number, mode: string) =>
      run(real, level, mode).params.pairs[0]!.bank.filter((t) => t.origin === 'distractor').length;
    expect(count(5, 'oson')).toBe(0);
    expect(count(5, 'orta')).toBe(0);
    expect(count(1, 'qiyin')).toBe(2);
    expect(count(60, 'qiyin')).toBe(4);
  });

  it('Qiyin distractors never turn a word into another valid word', () => {
    const uzWords = new Set(real.map((i) => i.uz.latn));
    const srcWords = new Set(
      real.flatMap((i) => i.sources.filter((s) => s.lang === 'tr').map((s) => s.text)),
    );
    for (let level = 1; level <= 60; level += 7) {
      for (const p of run(real, level, 'qiyin').params.pairs) {
        for (const d of p.bank.filter((t) => t.origin === 'distractor')) {
          for (const [w, words] of [
            [p.source, srcWords],
            [p.uz, uzWords],
          ] as const) {
            const subs = w.letters.map((_, i) => w.letters.with(i, d.letter).join(''));
            const ins = w.letters.map((_, i) => w.letters.toSpliced(i, 0, d.letter).join(''));
            for (const v of [...subs, ...ins])
              if (v !== w.letters.join('')) expect(words.has(v), `${w.text} -> ${v}`).toBe(false);
          }
        }
      }
    }
  });

  it('puts correspondence counterparts first', () => {
    const koz = makeItem({}); // göz -> koʻz, correspondence g>k, ö>oʻ
    const [pair] = run([koz], 1, 'qiyin').params.pairs;
    const extra = pair!.bank.filter((t) => t.origin === 'distractor').map((t) => t.letter);
    expect(extra).toHaveLength(2);
    expect(extra.every((l) => ['g', 'k', 'ö', 'oʻ'].includes(l))).toBe(true);
  });
});

describe('bank invariant', () => {
  it('bank letters = source + uz + distractors for every mode and level', () => {
    for (const mode of ['oson', 'orta', 'qiyin'])
      for (const level of [1, 2, 16, 31, 46, 60])
        for (const settings of [
          trLatn,
          { sourceLangs: ['tr', 'ru', 'fa', 'ar'] as const, script: 'cyrl' as const },
        ])
          for (const p of run(real, level, mode, settings as GameSettings).params
            .pairs as ImloPair[]) {
            const letters = p.bank.map((t) => t.letter);
            const expected = [
              ...p.source.letters,
              ...p.uz.letters,
              ...p.bank.filter((t) => t.origin === 'distractor').map((t) => t.letter),
            ];
            expect(sorted(letters)).toEqual(sorted(expected));
            expect(p.bank.filter((t) => t.origin === 'source')).toHaveLength(
              p.source.letters.length,
            );
            if (mode !== 'qiyin') expect(p.bank.some((t) => t.origin === 'distractor')).toBe(false);
          }
  });
});

import { readFileSync } from 'node:fs';
import { loadItems } from '@core/content/index.ts';
import { createRng } from '@core/random/index.ts';
import { levelContext } from '../sim-adapter.ts';
import type { GameSettings } from '../types.ts';
import type { GameEvent } from '@core/session/index.ts';
import { createImloDefinition } from './definition.ts';
import type { ImloEvent } from './rules.ts';

const items = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));
const def = createImloDefinition(items);
const settings: GameSettings = { sourceLangs: ['tr'], script: 'latn' };
const spec = def.levels(levelContext('imlo', 1, settings, [], 'oson'));
const pair = spec.params.pairs[0]!;
/** The rules' own events travel through the shell as plain `GameEvent`s. */
const ev = (e: ImloEvent) => e as unknown as GameEvent;

describe('Imlo definition', () => {
  it('declares its identity, three modes and four chapters of fifteen levels', () => {
    expect(def.id).toBe('imlo');
    expect(def.title).toEqual({ uzLatn: 'Imlo', uzCyrl: 'Имло' });
    expect(def.modes?.map((m) => m.id)).toEqual(['oson', 'orta', 'qiyin']);
    expect(def.modes?.map((m) => m.name.uzLatn)).toEqual(['Oson', 'Oʻrta', 'Qiyin']);
    expect(def.chapters).toHaveLength(4);
    expect(def.chapters?.every((c) => c.levels === 15)).toBe(true);
  });

  it('builds a level that carries the picked mode', () => {
    expect(spec.params.mode).toBe('oson');
    expect(spec.lives).toBe(3);
    expect(spec.params.pairs.length).toBeGreaterThan(0);
  });

  it('builds rules for an attempt', () => {
    const rules = def.createRules(spec, createRng(1));
    expect(rules.init.pair).toBe(0);
  });

  it('scales the score by mode and by Cyrillic', () => {
    expect(def.multipliers?.(settings, 'oson')).toEqual([1]);
    expect(def.multipliers?.(settings, 'qiyin')).toEqual([1.5]);
    expect(def.multipliers?.({ ...settings, script: 'cyrl' }, 'orta')).toEqual([1.25, 1.2]);
  });

  it('logs a correct spelling with its source language and response time', () => {
    const out = def.logEvents?.(
      spec,
      ev({ type: 'spellCorrect', itemId: pair.itemId, checks: 2, hints: 1 }),
      1234,
    );
    expect(out).toEqual([
      {
        type: 'spell_correct',
        gameId: 'imlo',
        itemId: pair.itemId,
        sourceLang: pair.source.lang,
        rtMs: 1234,
        checks: 2,
        hints: 1,
      },
    ]);
  });

  it('logs a wrong spelling with what was given and what was expected', () => {
    const out = def.logEvents?.(
      spec,
      ev({ type: 'spellWrong', itemId: pair.itemId, side: 'uz', given: 'isim', expected: 'ism' }),
      800,
    );
    expect(out).toEqual([
      {
        type: 'spell_wrong',
        gameId: 'imlo',
        itemId: pair.itemId,
        sourceLang: pair.source.lang,
        side: 'uz',
        given: 'isim',
        expected: 'ism',
        rtMs: 800,
      },
    ]);
  });

  it('logs a hint with its side and slot', () => {
    const out = def.logEvents?.(
      spec,
      ev({ type: 'hintUsed', itemId: pair.itemId, side: 'source', slot: 2 }),
      0,
    );
    expect(out).toEqual([
      { type: 'hint_used', gameId: 'imlo', itemId: pair.itemId, side: 'source', slot: 2 },
    ]);
  });

  it('logs nothing for placement events or unknown items', () => {
    expect(
      def.logEvents?.(spec, ev({ type: 'placed', side: 'uz', slot: 0, tileId: 'x' }), 0),
    ).toEqual([]);
    expect(
      def.logEvents?.(spec, ev({ type: 'spellCorrect', itemId: 'nope', checks: 1, hints: 0 }), 0),
    ).toEqual([]);
  });
});

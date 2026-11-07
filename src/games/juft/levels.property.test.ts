import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { loadItems } from '@core/content/index.ts';
import type { SourceLang } from '@core/text/index.ts';
import { levelContext } from '../sim-adapter.ts';
import { MAX_PAIRS } from './difficulty.config.ts';
import { createJuftLevels } from './levels.ts';

const items = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));
const levels = createJuftLevels(items);
const langsArb = fc
  .subarray<SourceLang>(['tr', 'ru', 'fa', 'ar'], { minLength: 1 })
  .map((sourceLangs) => ({ sourceLangs, script: 'latn' as const }));
const levelArb = fc.integer({ min: 1, max: 160 });

describe('juft levels: invariants', () => {
  it('every tile has exactly one match: pair ids, Uzbek forms and source forms are all unique', () => {
    fc.assert(
      fc.property(levelArb, langsArb, (level, settings) => {
        const { params } = levels(levelContext('juft', level, settings, []));
        const ids = params.pairs.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(params.pairs.map((p) => p.uz.latn)).size).toBe(ids.length);
        expect(new Set(params.pairs.map((p) => p.uz.cyrl)).size).toBe(ids.length);
        expect(new Set(params.pairs.map((p) => p.source.text)).size).toBe(ids.length);
      }),
    );
  });
  it('is deterministic and uses only enabled languages', () => {
    fc.assert(
      fc.property(levelArb, langsArb, (level, settings) => {
        const a = levels(levelContext('juft', level, settings, []));
        const b = levels(levelContext('juft', level, settings, []));
        expect(a).toEqual(b);
        for (const p of a.params.pairs) expect(settings.sourceLangs).toContain(p.source.lang);
      }),
    );
  });
  it('has between 1 and 12 pairs for every level', () => {
    fc.assert(
      fc.property(levelArb, langsArb, (level, settings) => {
        const n = levels(levelContext('juft', level, settings, [])).params.pairs.length;
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(MAX_PAIRS);
      }),
    );
  });
  it('seed does not depend on language order', () => {
    fc.assert(
      fc.property(levelArb, langsArb, (level, settings) => {
        const rev = { ...settings, sourceLangs: [...settings.sourceLangs].reverse() };
        const a = levels(levelContext('juft', level, settings, []));
        const b = levels(levelContext('juft', level, rev, []));
        expect(a).toEqual(b);
      }),
    );
  });
});

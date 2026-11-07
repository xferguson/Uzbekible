import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, it } from 'vitest';
import { loadItems } from '@core/content/index.ts';
import type { SourceLang } from '@core/text/index.ts';
import { levelContext } from '../sim-adapter.ts';
import { createImloLevels } from './levels.ts';

const levels = createImloLevels(
  loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8'))),
);
const sorted = (xs: readonly string[]) => [...xs].sort();

describe('imlo levels (property)', () => {
  it('bank letters are source + uz + distractors; only Qiyin has distractors; same context, same spec', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 70 }),
        fc.constantFrom('oson', 'orta', 'qiyin'),
        fc.subarray(['tr', 'ru', 'fa', 'ar'] as SourceLang[], { minLength: 1 }),
        fc.constantFrom('latn' as const, 'cyrl' as const),
        (level, mode, sourceLangs, script) => {
          const ctx = () => levelContext('imlo', level, { sourceLangs, script }, [], mode);
          const spec = levels(ctx());
          if (JSON.stringify(spec) !== JSON.stringify(levels(ctx())))
            throw new Error('not deterministic');
          for (const p of spec.params.pairs) {
            const extra = p.bank.filter((t) => t.origin === 'distractor').map((t) => t.letter);
            if (mode !== 'qiyin' && extra.length > 0) throw new Error('unexpected distractors');
            const want = sorted([...p.source.letters, ...p.uz.letters, ...extra]);
            if (JSON.stringify(sorted(p.bank.map((t) => t.letter))) !== JSON.stringify(want))
              throw new Error(`bank mismatch for ${p.itemId}`);
            if (p.source.letters.length > 8 || p.uz.letters.length > 8) throw new Error('too long');
          }
        },
      ),
      { numRuns: 60 },
    );
  });
});

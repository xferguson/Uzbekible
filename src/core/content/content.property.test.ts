import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeItem } from './fixtures';
import { buildPack, serializePack } from './build';

const itemArb = fc
  .record({
    n: fc.integer({ min: 0, max: 5000 }),
    rank: fc.integer({ min: 1, max: 1000 }),
  })
  .map(({ n, rank }) => makeItem({ id: `uz-w${n}`, freqRank: rank }));

describe('build output (property)', () => {
  it('is byte-identical for any permutation of the same items', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(itemArb, { selector: (i) => i.id }),
        fc.integer(),
        (items, seed) => {
          const shuffled = [...items].sort(
            (a, b) =>
              ((a.id.length * seed) % 7) - ((b.id.length * seed) % 7) ||
              a.id.localeCompare(b.id) * (seed % 2 ? 1 : -1),
          );
          expect(serializePack(buildPack(shuffled))).toBe(serializePack(buildPack(items)));
        },
      ),
    );
  });
  it('is idempotent through JSON', () => {
    fc.assert(
      fc.property(fc.uniqueArray(itemArb, { selector: (i) => i.id }), (items) => {
        const once = serializePack(buildPack(items));
        const twice = serializePack(buildPack(JSON.parse(once).items));
        expect(twice).toBe(once);
      }),
    );
  });
});

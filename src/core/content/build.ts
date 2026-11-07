import { ItemSchema, type Item, type Pack } from './schema.ts';
import type { SourceLang } from '../text/index.ts';

/** Frequency rank, then id: the one deterministic item order. */
export function compareByFrequency(a: Item, b: Item): number {
  return a.freqRank - b.freqRank || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export type TransparencyFn = (item: Item) => Partial<Record<SourceLang, number>>;

/** Deterministic pack: sorted by frequency rank then id, schema key order, optional computed transparency. */
export function buildPack(
  items: readonly Item[],
  opts: { transparency?: TransparencyFn } = {},
): Pack {
  const sorted = [...items].sort(compareByFrequency);
  return {
    version: 1,
    items: sorted.map((item) => {
      const t = opts.transparency?.(item);
      return ItemSchema.parse(t === undefined ? item : { ...item, transparency: t });
    }),
  };
}

/** The exact bytes written to public/content/items.v1.json. */
export function serializePack(pack: Pack): string {
  return JSON.stringify(pack) + '\n';
}

import { ItemSchema, type Item, type Lang, type Pack } from './schema.ts';

export type TransparencyFn = (item: Item) => Partial<Record<Lang, number>>;

/** Deterministic pack: sorted by frequency rank then id, schema key order, optional computed transparency. */
export function buildPack(
  items: readonly Item[],
  opts: { transparency?: TransparencyFn } = {},
): Pack {
  const sorted = [...items].sort(
    (a, b) => a.freqRank - b.freqRank || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
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

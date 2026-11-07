import { transparency } from '../similarity/index.ts';
import type { SourceLang } from '../text/index.ts';
import type { Item } from './schema.ts';

/**
 * Per-language transparency of an item for the build (`Item.transparency`). Only Turkish is scored:
 * the best `transparency(source.text, item.uz.latn)` over the item's `tr` sources. Languages without
 * a score (ru, fa, ar, or no source in that language) are omitted, never 0.
 */
export function itemTransparency(item: Item): Partial<Record<SourceLang, number>> {
  const scores = item.sources
    .filter((s) => s.lang === 'tr')
    .map((s) => transparency(s.text, item.uz.latn));
  return scores.length ? { tr: Math.max(...scores) } : {};
}

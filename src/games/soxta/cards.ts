/**
 * Soxta card pool: false-friend items turned into swipe cards. Complementary to `boardPool`, which excludes
 * exactly the items this pool admits (so no item is in both).
 */
import type { Item, SourceForm } from '../../core/content/index.ts';

export type CardTier = 1 | 2 | 3;

export interface Card {
  id: string;
  uz: Item;
  other: { lang: SourceForm['lang']; text: string };
  clues: { uz: string; other?: string };
  tier: CardTier;
}

/** Highest frequency rank (inclusive) of each tier; anything above falls in tier 3. */
export const TIER_MAX_RANK = [300, 600] as const;

export const tierOf = (freqRank: number): CardTier =>
  freqRank <= TIER_MAX_RANK[0] ? 1 : freqRank <= TIER_MAX_RANK[1] ? 2 : 3;

const isPartial = (s: SourceForm): boolean => s.partial === true || /\bpartial\b/i.test(s.ref);

const turkishFalseFriend = (item: Item): SourceForm | undefined =>
  item.sources.find((s) => s.lang === 'tr' && s.relation === 'false-friend');

/** Cards for Soxta v1: Turkish, non-partial false friends of live items that have an English gloss. */
export function soxtaPool(items: readonly Item[]): Card[] {
  const cards: Card[] = [];
  for (const item of items) {
    if (item.deprecated || item.glossEn.trim() === '') continue;
    const source = turkishFalseFriend(item);
    if (!source || isPartial(source)) continue;
    cards.push({
      id: item.id,
      uz: item,
      other: { lang: source.lang, text: source.text },
      clues: source.glossEn ? { uz: item.glossEn, other: source.glossEn } : { uz: item.glossEn },
      tier: tierOf(item.freqRank),
    });
  }
  return cards;
}

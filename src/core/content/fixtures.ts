import type { Item } from './schema';

/** A small valid item for tests; override fields per case. */
export function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: 'uz-koz',
    uz: { latn: 'koʻz', cyrl: 'кўз' },
    freqRank: 312,
    form: 'lemma',
    pos: 'noun',
    glossEn: 'eye',
    sources: [
      {
        lang: 'tr',
        text: 'göz',
        relation: 'turkic-cognate',
        confidence: 'high',
        correspondence: ['g>k', 'ö>oʻ'],
        ref: 'wiktionary:göz',
      },
    ],
    tags: ['body'],
    ...over,
  };
}

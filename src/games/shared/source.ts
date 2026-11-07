/**
 * Choosing the one source-language form a pair shows. Shared by every game that pairs an Uzbek word with a
 * word from an enabled source language (Juft, Imlo): Turkish first, otherwise a random enabled language.
 */
import type { Confidence, Item, SourceForm } from '../../core/content/index.ts';
import type { Rng } from '../../core/random/index.ts';
import type { SourceLang } from '../../core/text/index.ts';

const LANG_ORDER: readonly SourceLang[] = ['tr', 'fa', 'ru', 'ar'];
const CONFIDENCE_RANK: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };

/** The most trustworthy of some forms (first wins a tie). */
export function bestOf(forms: readonly SourceForm[]): SourceForm {
  return [...forms].sort(
    (a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence],
  )[0]!;
}

/**
 * One source form among the enabled languages: Turkish when there is one, else a random enabled language.
 * False friends are never usable. `accept` further restricts the forms a game can show (e.g. by word length);
 * the item must have at least one usable form.
 */
export function chooseSource(
  item: Item,
  langs: ReadonlySet<SourceLang>,
  rng: Rng,
  accept: (form: SourceForm) => boolean = () => true,
): SourceForm {
  const usable = item.sources.filter(
    (s) => langs.has(s.lang) && s.relation !== 'false-friend' && accept(s),
  );
  const tr = usable.filter((s) => s.lang === 'tr');
  if (tr.length > 0) return bestOf(tr);
  const present = LANG_ORDER.filter((l) => usable.some((s) => s.lang === l));
  const lang = present.length === 1 ? present[0]! : present[rng.int(0, present.length - 1)]!;
  return bestOf(usable.filter((s) => s.lang === lang));
}

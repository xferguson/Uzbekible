/**
 * Which items next: new items in frequency order, plus re-shown missed items.
 *
 * Mastery estimate (per item, pooled over its enabled-language aggregates):
 *   mastery = (correct + 1) / (attempts + 2)        // Laplace-smoothed accuracy; unseen = 0.5
 * An item is "missed" when it has attempts and correct < attempts. Review picks are drawn without
 * replacement from missed items with weight (1 - mastery), so the worst-known items return most often.
 */
import type { Aggregate } from '../learning-log/index.ts';
import { boardPool, compareByFrequency } from '../content/index.ts';
import type { Item } from '../content/schema.ts';
import type { SourceLang } from '../text/index.ts';
import { weightedPick, type Rng } from '../random/index.ts';

export interface SchedulerOptions {
  /** Fraction of the level reserved for re-showing missed items, 0..1. Default 0.3. */
  reviewRatio?: number;
  /** Enabled source languages; items need a source in one of them. Omit for all. */
  enabledLangs?: readonly SourceLang[];
}

export const DEFAULT_REVIEW_RATIO = 0.3;

/** Laplace-smoothed accuracy over the given aggregates (0.5 when there are none). */
export function masteryOf(rows: readonly Pick<Aggregate, 'attempts' | 'correct'>[]): number {
  let attempts = 0;
  let correct = 0;
  for (const r of rows) {
    attempts += r.attempts;
    correct += r.correct;
  }
  return (correct + 1) / (attempts + 2);
}

export function nextItems(
  pool: readonly Item[],
  history: readonly Aggregate[],
  n: number,
  rng: Rng,
  opts: SchedulerOptions = {},
): Item[] {
  const ratio = opts.reviewRatio ?? DEFAULT_REVIEW_RATIO;
  if (!(ratio >= 0 && ratio <= 1))
    throw new RangeError(`reviewRatio must be in [0, 1], got ${ratio}`);
  const langs = opts.enabledLangs;
  const enabled = (l: SourceLang): boolean => !langs || langs.includes(l);

  const eligible = boardPool(pool)
    .filter((it) => it.sources.some((s) => enabled(s.lang)))
    .sort(compareByFrequency);
  const want = Math.min(Math.max(0, Math.floor(n)), eligible.length);
  if (want === 0) return [];

  const rows = new Map<string, Aggregate[]>();
  for (const a of history) {
    if (!enabled(a.sourceLang)) continue;
    const list = rows.get(a.itemId);
    if (list) list.push(a);
    else rows.set(a.itemId, [a]);
  }
  const seen = (it: Item): boolean => (rows.get(it.id) ?? []).some((r) => r.attempts > 0);
  const missed = (it: Item): boolean => (rows.get(it.id) ?? []).some((r) => r.correct < r.attempts);
  const mastery = (it: Item): number => masteryOf(rows.get(it.id) ?? []);

  const chosen: Item[] = [];
  const taken = new Set<string>();
  const take = (it: Item): void => {
    chosen.push(it);
    taken.add(it.id);
  };

  // 1. Review slots: weighted draw from missed items.
  const reviewable = eligible.filter(missed);
  const reviewSlots = Math.min(Math.round(want * ratio), reviewable.length);
  for (let i = 0; i < reviewSlots; i++) {
    const left = reviewable.filter((it) => !taken.has(it.id));
    take(
      weightedPick(
        rng,
        left,
        left.map((it) => 1 - mastery(it)),
      ),
    );
  }

  // 2. New (never attempted) items by frequency.
  for (const it of eligible) {
    if (chosen.length >= want) break;
    if (!taken.has(it.id) && !seen(it)) take(it);
  }

  // 3. Fill with seen items, least mastered first.
  const rest = eligible.filter((it) => !taken.has(it.id)).sort((a, b) => mastery(a) - mastery(b));
  for (const it of rest) {
    if (chosen.length >= want) break;
    take(it);
  }
  return chosen;
}

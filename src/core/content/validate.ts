import { canonicalizeUz, latnToCyrl } from '../text/index.ts';
import { ItemSchema, type Item } from './schema.ts';
import type { SourceLang } from '../text/index.ts';

export type IssueCode =
  | 'schema'
  | 'bad-id'
  | 'duplicate-id'
  | 'uz-latn-missing'
  | 'uz-cyrl-missing'
  | 'cyrl-mismatch'
  | 'apostrophe'
  | 'source-script'
  | 'lemma-missing'
  | 'lemma-unknown'
  | 'false-friend-in-pool'
  | 'weak-ref';

export interface Issue {
  code: IssueCode;
  severity: 'error' | 'warning';
  id: string;
  message: string;
}

export interface Validation {
  issues: Issue[];
  /** Items that parsed against the schema (some may still carry errors from other checks). */
  items: Item[];
}

const CYRILLIC = /^[\p{Script=Cyrillic}\s'ʼ-]+$/u;
const LATIN = /^[\p{Script=Latin}ʻʼ\s'-]+$/u;
const ARABIC = /^[\p{Script=Arabic}‌\s]+$/u;
const SCRIPT_OF: Record<SourceLang, { re: RegExp; name: string }> = {
  tr: { re: LATIN, name: 'Latin' },
  ru: { re: CYRILLIC, name: 'Cyrillic' },
  fa: { re: ARABIC, name: 'Arabic script' },
  ar: { re: ARABIC, name: 'Arabic script' },
};

const ID = /^uz-[a-z0-9]+(-[a-z0-9]+)*$/;
const WEAK_REF = /^curator:/;

/** Items tagged `pool:<game>` are drawn onto boards; those must not contain false friends. */
export const isPooled = (item: Item): boolean => item.tags.some((t) => t.startsWith('pool:'));
export const isFalseFriend = (item: Item): boolean =>
  item.sources.some((s) => s.relation === 'false-friend');

/** Items a match board may draw: not deprecated and with no false-friend source. */
export function boardPool(items: readonly Item[]): Item[] {
  return items.filter((i) => !i.deprecated && !isFalseFriend(i));
}

function checkItem(item: Item, ids: ReadonlySet<string>): Issue[] {
  const out: Issue[] = [];
  const add = (code: IssueCode, severity: Issue['severity'], message: string) =>
    out.push({ code, severity, id: item.id, message });

  if (!ID.test(item.id))
    add('bad-id', 'error', `id "${item.id}" must be kebab-case starting with "uz-"`);

  const { latn, cyrl } = item.uz;
  if (!LATIN.test(latn)) add('uz-latn-missing', 'error', `uz.latn "${latn}" is not Latin script`);
  else if (canonicalizeUz(latn) !== latn)
    add('apostrophe', 'error', `uz.latn "${latn}" must use canonical apostrophes (U+02BB, U+02BC)`);
  if (!CYRILLIC.test(cyrl))
    add('uz-cyrl-missing', 'error', `uz.cyrl "${cyrl}" is missing or not Cyrillic`);
  else if (LATIN.test(latn) && latnToCyrl(latn) !== cyrl)
    add(
      'cyrl-mismatch',
      'warning',
      `uz.cyrl "${cyrl}" differs from transliteration "${latnToCyrl(latn)}"`,
    );

  for (const s of item.sources) {
    const { re, name } = SCRIPT_OF[s.lang];
    if (!re.test(s.text))
      add('source-script', 'error', `${s.lang} source "${s.text}" must be in ${name}`);
    if (WEAK_REF.test(s.ref) && s.confidence !== 'low')
      add('weak-ref', 'warning', `${s.lang} source "${s.text}" has only a curator ref`);
  }

  if (item.form === 'inflected') {
    if (!item.lemma) add('lemma-missing', 'error', 'inflected item needs a lemma id');
    else if (!ids.has(item.lemma))
      add('lemma-unknown', 'error', `lemma "${item.lemma}" is not an item id`);
  }
  if (isPooled(item) && isFalseFriend(item))
    add('false-friend-in-pool', 'error', 'false friends must not be tagged for a board pool');
  return out;
}

/** Validates raw (parsed YAML/JSON) items. Never throws; every fault becomes an Issue. */
export function validateItems(raw: readonly unknown[]): Validation {
  const issues: Issue[] = [];
  const items: Item[] = [];
  raw.forEach((entry, index) => {
    const parsed = ItemSchema.safeParse(entry);
    if (parsed.success) {
      items.push(parsed.data);
      return;
    }
    const id = (entry as { id?: unknown } | null)?.id;
    const at = typeof id === 'string' ? id : `(item #${index})`;
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    issues.push({ code: 'schema', severity: 'error', id: at, message: detail });
  });

  const ids = new Set(items.map((i) => i.id));
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id))
      issues.push({
        code: 'duplicate-id',
        severity: 'error',
        id: item.id,
        message: `duplicate id "${item.id}"`,
      });
    seen.add(item.id);
    issues.push(...checkItem(item, ids));
  }
  return { issues, items };
}

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  boardPool,
  buildPack,
  serializePack,
  validateItems,
} from '../../src/core/content/index.ts';

const dir = join(import.meta.dirname, '../items');
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.yaml'))
  .sort();
const read = (f: string): unknown[] => parse(readFileSync(join(dir, f), 'utf8')) as unknown[];
const all = files.flatMap(read);

describe('curated items under content/items', () => {
  it('validate with no errors across all files (unique ids, both scripts, native source scripts)', () => {
    const errors = validateItems(all).issues.filter((i) => i.severity === 'error');
    expect(errors).toEqual([]);
  });
  it('seed fixture has about 20 items, including inflected forms with known lemmas and a Persian-script source', () => {
    const seed = validateItems(read('seed.yaml')).items;
    expect(seed.length).toBeGreaterThanOrEqual(15);
    expect(seed.some((i) => i.form === 'inflected')).toBe(true);
    expect(seed.some((i) => i.sources.some((s) => s.lang === 'fa'))).toBe(true);
  });
  it('builds a stable pack and keeps false friends out of board pools', () => {
    const { items } = validateItems(all);
    const bytes = serializePack(buildPack(items));
    expect(serializePack(buildPack([...items].reverse()))).toBe(bytes);
    expect(boardPool(items).length).toBeLessThan(items.length);
  });
});

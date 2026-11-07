// content:* CLI. Run through npm: content:validate | content:review | content:build
// Reads content/items/*.yaml; all rules live in src/core/content.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {
  buildPack,
  renderReview,
  serializePack,
  validateItems,
  type TransparencyFn,
} from '../../src/core/content/index.ts';
import * as similarity from '../../src/core/similarity/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const itemsDir = join(root, 'content/items');

function readRaw(): unknown[] {
  return readdirSync(itemsDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .flatMap((f) => {
      const doc: unknown = parse(readFileSync(join(itemsDir, f), 'utf8'));
      return Array.isArray(doc) ? (doc as unknown[]) : [];
    });
}

function write(file: string, data: string): void {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`wrote ${file}`);
}

function validated() {
  const result = validateItems(readRaw());
  const errors = result.issues.filter((i) => i.severity === 'error');
  for (const i of result.issues)
    console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '} ${i.code} ${i.id}: ${i.message}`);
  console.log(
    `${result.items.length} items, ${errors.length} errors, ${result.issues.length - errors.length} warnings`,
  );
  return { ...result, errors };
}

// Transparency comes from core/similarity once K8 is merged; until then it is omitted.
const scorer = (similarity as { transparency?: unknown }).transparency;
const transparency = typeof scorer === 'function' ? (scorer as TransparencyFn) : undefined;

const command = process.argv[2];
const { items, issues, errors } = validated();
if (command === 'validate') {
  process.exit(errors.length ? 1 : 0);
} else if (command === 'review') {
  write('docs/content/review.md', renderReview(items, issues));
} else if (command === 'build') {
  if (errors.length) process.exit(1);
  write(
    'public/content/items.v1.json',
    serializePack(buildPack(items, transparency ? { transparency } : {})),
  );
} else {
  console.error('usage: cli.ts validate | review | build');
  process.exit(2);
}

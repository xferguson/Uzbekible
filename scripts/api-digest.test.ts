// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeEntry, renderDigest } from './api-digest.mjs';

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'api-digest-'));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

describe('describeEntry', () => {
  it('renders exported functions with signature and first JSDoc line, omitting helpers', () => {
    const dir = fixture({
      'index.ts': [
        '/** Does x. */',
        'export function f(a: number): string { return helper(a); }',
        'function helper(a: number): string { return String(a); }',
      ].join('\n'),
    });
    const lines = describeEntry(join(dir, 'index.ts'));
    expect(lines).toEqual(['- `f(a: number): string` - Does x.']);
  });

  it('covers types, consts, re-exports; sorted; first doc line only; no bodies', () => {
    const dir = fixture({
      'inner.ts': '/** Inner thing.\n * More detail. */\nexport const K = 5;\n',
      'index.ts': [
        "export { K } from './inner';",
        '/** A shape. */',
        'export interface Shape { a: number; b: string }',
        'export type Id = string;',
        'export class Box { x = 1 }',
        'export const zed = (n: number): number => n * 2;',
      ].join('\n'),
    });
    const lines = describeEntry(join(dir, 'index.ts'));
    expect(lines).toEqual([
      '- `Box` (class)',
      '- `Id` = `string`',
      '- `K`: `5` - Inner thing.',
      '- `Shape` { a: number; b: string } - A shape.',
      '- `zed(n: number): number`',
    ]);
    expect(lines.join('')).not.toContain('return');
  });
});

describe('renderDigest', () => {
  it('emits one ## per module in the given order', () => {
    const md = renderDigest([
      { name: 'b', lines: ['- `x`'] },
      { name: 'a', lines: [] },
    ]);
    expect(md).toMatch(/## `b`\n\n- `x`\n\n## `a`\n/);
  });
});

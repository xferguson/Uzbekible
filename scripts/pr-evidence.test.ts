// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkEvidence, isVisualPath, main } from './pr-evidence.mjs';

const body = (shots: string) =>
  `## Summary\nx\n\n## Screenshots / Artifact link\n${shots}\n\n## Checklist\n- [ ] a\n`;

describe('isVisualPath', () => {
  it.each([
    ['src/ui/Tile.tsx', true],
    ['src/ui/hooks/useX.ts', true],
    ['src/shell/App.tsx', true],
    ['src/games/soxta/Board.tsx', true],
    ['src/games/soxta/deep/Board.tsx', true],
    ['src/games/soxta/rules.ts', false],
    ['src/core/text/index.ts', false],
    ['src/styles/tokens.css', true],
    ['docs/PRD.md', false],
  ])('%s -> %s', (p, v) => expect(isVisualPath(p)).toBe(v));
});

describe('checkEvidence', () => {
  it('fails: n/a screenshots with a changed shell file', () => {
    expect(checkEvidence(['src/shell/App.tsx'], body('n/a')).ok).toBe(false);
  });
  it('fails on an empty or comment-only section', () => {
    expect(checkEvidence(['src/ui/A.tsx'], body('')).ok).toBe(false);
    expect(checkEvidence(['src/ui/A.tsx'], body('<!-- phone + desktop -->')).ok).toBe(false);
  });
  it('fails on text that names no comparison', () => {
    expect(checkEvidence(['src/ui/A.tsx'], body('looks fine')).ok).toBe(false);
  });
  it('passes with an Artifact link', () => {
    expect(checkEvidence(['src/ui/A.tsx'], body('https://claude.ai/artifact/abc')).ok).toBe(true);
  });
  it('passes with a shots/compare reference', () => {
    expect(checkEvidence(['x.css'], body('see shots/compare.html')).ok).toBe(true);
  });
  it('passes with the escape hatch plus a reason, fails without a reason', () => {
    const ok = `## Screenshots / Artifact link\nVisual change: none (hook refactor)\n`;
    expect(checkEvidence(['src/ui/A.tsx'], ok).ok).toBe(true);
    expect(checkEvidence(['src/ui/A.tsx'], body('Visual change: none')).ok).toBe(false);
  });
  it('passes when no visual file changed, whatever the body says', () => {
    expect(checkEvidence(['src/core/a.ts', 'docs/x.md'], body('n/a')).ok).toBe(true);
    expect(checkEvidence(['src/core/a.ts'], '').ok).toBe(true);
  });
  it('fails when the section is missing entirely', () => {
    expect(checkEvidence(['src/ui/A.tsx'], '## Summary\nx').ok).toBe(false);
  });
});

describe('main', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prev-'));
  const files = join(dir, 'files.txt');
  const bodyFile = join(dir, 'body.md');
  const run = (f: string, b: string) => {
    writeFileSync(files, f);
    writeFileSync(bodyFile, b);
    const out: string[] = [];
    return { code: main([files, bodyFile], (l) => out.push(l)), out };
  };
  it('exits 1 for n/a with src/shell/App.tsx', () => {
    const r = run('src/shell/App.tsx\n', body('n/a'));
    expect(r.code).toBe(1);
    expect(r.out.join('\n')).toMatch(/Visual change: none/);
  });
  it('exits 0 for a good body', () => {
    expect(run('src/shell/App.tsx\n', body('https://claude.ai/artifact/x')).code).toBe(0);
  });
  it('exits 2 on bad usage', () => {
    expect(main([], () => {})).toBe(2);
  });
});

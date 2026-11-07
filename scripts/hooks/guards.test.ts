// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decideBash } from './guard-bash.mjs';
import { decideEdit } from './guard-edit.mjs';

const bash = (command: string, merged = true, branch = 'task/X4-y') =>
  decideBash(
    { tool_input: { command } },
    () => merged,
    () => branch,
  );

function blocked(r: { block: boolean; reason?: string }): string {
  expect(r.block).toBe(true);
  return r.reason ?? '';
}

describe('guard-bash', () => {
  it.each([
    'git push --force origin x',
    'git push -f origin x',
    'git push --force-with-lease origin x',
    'git fetch && git push -uf origin x',
  ])('blocks force push: %s', (c) => {
    expect(blocked(bash(c))).toMatch(/force/i);
  });

  it('blocks rebase', () => {
    expect(blocked(bash('git rebase origin/main'))).toMatch(/merge/);
    expect(blocked(bash('git -C . rebase -i HEAD~2'))).toMatch(/rebase/);
  });

  it.each(['git push origin main', 'git push -u origin HEAD:main', 'git push'])(
    'blocks push to main: %s',
    (c) => {
      expect(blocked(bash(c, true, c === 'git push' ? 'main' : 'task/X4-y'))).toMatch(/main/);
    },
  );

  it('blocks push when origin/main is not merged', () => {
    expect(blocked(bash('git push -u origin task/X4-y', false))).toContain(
      'git fetch origin main && git merge origin/main',
    );
  });

  it('allows a push of a task branch with main merged', () => {
    expect(bash('git push -u origin task/X4-y').block).toBe(false);
  });

  it.each(['npm run gate', 'git status', 'git log --oneline', 'echo "git push -f"'])(
    'allows %s',
    (c) => {
      expect(bash(c, false).block).toBe(false);
    },
  );

  it('works end to end via stdin (exit 2 + reason, silent exit 0)', () => {
    const script = join(__dirname, 'guard-bash.mjs');
    const run = (command: string) =>
      spawnSync('node', [script], {
        input: JSON.stringify({ tool_input: { command }, cwd: __dirname }),
        encoding: 'utf8',
      });
    const bad = run('git push --force origin x');
    expect(bad.status).toBe(2);
    expect(bad.stderr.trim().split('\n')).toHaveLength(1);
    const ok = run('ls');
    expect(ok.status).toBe(0);
    expect(ok.stdout + ok.stderr).toBe('');
  });
});

const VITE = `  thresholds: {\n        'src/core/**': { lines: 95, branches: 95, perFile: true },\n        'src/ui/**': { lines: 80, branches: 80 },\n      },\n`;
const edit = (file_path: string, old_string: string, new_string: string, current: string | null) =>
  decideEdit({ tool_input: { file_path, old_string, new_string } }, () => current);

describe('guard-edit', () => {
  it('blocks package-lock.json', () => {
    expect(
      blocked(
        decideEdit(
          { tool_input: { file_path: '/r/package-lock.json', content: '{}' } },
          () => '{}',
        ),
      ),
    ).toMatch(/package-lock/);
  });

  it('blocks a new it.only( in a test file', () => {
    expect(blocked(edit('/r/a.test.ts', "it('x'", "it.only('x'", "it('x', () => {})"))).toMatch(
      /only/,
    );
  });

  it('blocks describe.skip( via Write of a new file', () => {
    const r = decideEdit(
      { tool_input: { file_path: '/r/e2e/a.spec.ts', content: "describe.skip('x', () => {})" } },
      () => null,
    );
    expect(blocked(r)).toMatch(/skip/);
  });

  it('allows existing .skip and non-test files', () => {
    expect(edit('/r/a.test.ts', 'a', 'b', "it.skip('a'").block).toBe(false);
    expect(edit('/r/a.ts', 'a', "it.only('b'", 'a').block).toBe(false);
  });

  it('blocks lowering a coverage threshold or removing one', () => {
    expect(blocked(edit('/r/vite.config.ts', 'lines: 80', 'lines: 70', VITE))).toMatch(
      /src\/ui\/\*\*\.lines 80 -> 70/,
    );
    expect(blocked(edit('/r/vite.config.ts', ', branches: 80', '', VITE))).toMatch(/removed/);
  });

  it('allows raising thresholds and other vite edits', () => {
    expect(edit('/r/vite.config.ts', 'lines: 80', 'lines: 85', VITE).block).toBe(false);
    expect(edit('/r/vite.config.ts', 'thresholds', 'thresholds', VITE).block).toBe(false);
  });
});

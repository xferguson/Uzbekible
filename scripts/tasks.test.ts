// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS module without types
import { check, checkFrames, isDone, loadBoard, readyNext, render } from './tasks.mjs';

function fixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
const task = (status: string, deps: string) =>
  `# T\n\n| | |\n|---|---|\n| Status | ${status} |\n| Depends on | ${deps} |\n`;
const readme = (rows: string[]) =>
  `| ID | Title |\n|---|---|\n${rows.map((r) => `| ${r} | x |`).join('\n')}\n`;

describe('task board', () => {
  const chain = {
    'A1-a.md': task('done', 'none'),
    'B1-b.md': task('todo', '[A1](A1-a.md)'),
    'C1-c.md': task('todo', '[B1](B1-b.md)'),
    'README.md': readme(['[A1](A1-a.md)', '[B1](B1-b.md)', '[C1](C1-c.md) 🔒']),
  };

  it('ready next of A(done) <- B(todo) <- C(todo) is [B]', () => {
    const board = loadBoard(fixture(chain));
    expect(readyNext(board).map((t: { id: string }) => t.id)).toEqual(['B1']);
    expect(isDone(board.tasks.get('A1'))).toBe(true);
    expect(check(board)).toEqual([]);
  });

  it('marks locked tasks and renders a table', () => {
    const board = loadBoard(fixture(chain));
    expect(board.tasks.get('C1').locked).toBe(true);
    const out = render(board);
    expect(out).toContain('Ready next:');
    expect(out).toContain('B1');
  });

  it('check fails on a missing dependency', () => {
    const board = loadBoard(fixture({ ...chain, 'B1-b.md': task('todo', '[Z9](Z9-z.md)') }));
    expect(check(board).join('\n')).toMatch(/depends on Z9/);
  });

  it('check fails on README/file mismatch and bad status', () => {
    const board = loadBoard(
      fixture({
        ...chain,
        'D1-d.md': task('wip', 'none'),
        'README.md': readme(['[A1](A1-a.md)', '[B1](B1-b.md)', '[C1](C1-c.md)', '[E1](E1-e.md)']),
      }),
    );
    const out = check(board).join('\n');
    expect(out).toMatch(/E1 but docs\/tasks\/E1/);
    expect(out).toMatch(/D1-d\.md is not listed/);
    expect(out).toMatch(/Status "wip"/);
  });

  it('accepts "on hold: reason"', () => {
    const board = loadBoard(
      fixture({
        'A1-a.md': task('on hold: later', 'none'),
        'README.md': readme(['[A1](A1-a.md)']),
      }),
    );
    expect(check(board)).toEqual([]);
  });

  it('the real board is consistent', () => {
    expect(check(loadBoard(join(process.cwd(), 'docs', 'tasks')))).toEqual([]);
  });
});

describe('frame ownership', () => {
  const owned = (status: string, screens: string) =>
    `# T\n\n| | |\n|---|---|\n| Status | ${status} |\n| Depends on | none |\n| Screens owned | ${screens} |\n`;
  const states = ['home', 'board-1'];
  const run = (files: Record<string, string>) =>
    checkFrames(loadBoard(fixture({ ...files, 'README.md': readme([]) })), states).join('\n');

  it('fails when a frame is claimed by no task', () => {
    const out = run({ 'A1-a.md': owned('done', '`home`') });
    expect(out).toMatch(/board-1.*no task/);
  });

  it('fails when two tasks that are not done claim the same frame', () => {
    const out = run({
      'A1-a.md': owned('todo', '`home`, `board-1`'),
      'B1-b.md': owned('in progress', '`home`'),
    });
    expect(out).toMatch(/home.*A1, B1/);
  });

  it('allows a done task and a later task to claim the same frame; rejects unknown frames', () => {
    const ok = run({
      'A1-a.md': owned('done', '`home`, `board-1`'),
      'B1-b.md': owned('todo', '`home`'),
    });
    expect(ok).toBe('');
    expect(run({ 'A1-a.md': owned('done', '`home`, `board-1`, `nope`') })).toMatch(/nope/);
  });

  it('treats "none" as no claim', () => {
    expect(run({ 'A1-a.md': owned('done', 'none') })).toMatch(/home.*no task/);
  });
});

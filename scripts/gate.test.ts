// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MAX_ERROR_LINES, STEPS, runGate, type GateStep } from './gate.mjs';

const step = (name: string, extra: Partial<GateStep> = {}): GateStep => ({
  name,
  cmd: name,
  args: ['--x'],
  errors: (o) => o.split('\n').filter((l) => l.includes(': error')),
  ...extra,
});

function harness(results: Record<string, { code: number; output?: string }>, steps: GateStep[]) {
  const called: string[] = [];
  const out: string[] = [];
  let t = 0;
  const promise = runGate({
    steps,
    run: async (s) => {
      called.push(s.name);
      const r = results[s.name] ?? { code: 0 };
      return { code: r.code, output: r.output ?? '' };
    },
    write: (l) => out.push(l),
    now: () => (t += 1000),
  });
  return { called, out, promise };
}

const four = () => ['lint', 'typecheck', 'test', 'build'].map((n) => step(n));

describe('runGate', () => {
  it('stops at the first failing step, skips later ones and exits 1', async () => {
    const h = harness(
      { typecheck: { code: 2, output: 'a.ts(1,2): error TS1: bad\nnoise' } },
      four(),
    );
    expect(await h.promise).toBe(1);
    expect(h.called).toEqual(['lint', 'typecheck']);
    const text = h.out.join('\n');
    expect(text).toContain('typecheck FAILED');
    expect(text).toContain('a.ts(1,2): error TS1: bad');
    expect(text).not.toContain('noise');
    expect(text).toContain('Re-run the single step');
    expect(text).not.toContain('GATE OK');
  });

  it('prints a short report ending in GATE OK when everything passes', async () => {
    const steps = four();
    steps[2] = step('test', { summary: () => ['Lines : 99%'] });
    const h = harness({}, steps);
    expect(await h.promise).toBe(0);
    expect(h.called).toEqual(['lint', 'typecheck', 'test', 'build']);
    expect(h.out.at(-1)).toBe('GATE OK');
    expect(h.out).toContain('Lines : 99%');
    expect(h.out.length).toBeLessThanOrEqual(15);
  });

  it('caps error output and falls back to the output tail', async () => {
    const many = Array.from({ length: 200 }, (_, i) => `f.ts:${i}: error x`).join('\n');
    const h1 = harness({ lint: { code: 1, output: many } }, four());
    await h1.promise;
    expect(h1.out.filter((l) => l.startsWith('f.ts:')).length).toBe(MAX_ERROR_LINES);

    const h2 = harness({ lint: { code: 1, output: 'boom\nunparsed failure' } }, four());
    await h2.promise;
    expect(h2.out).toContain('unparsed failure');
  });
});

describe('STEPS', () => {
  it('runs lint → typecheck → test → build in order', () => {
    expect(STEPS.map((s) => s.name)).toEqual(['lint', 'typecheck', 'test', 'build']);
  });
  it('extracts compact lint, tsc and coverage lines', () => {
    const [lint, tsc, test] = STEPS as [GateStep, GateStep, GateStep];
    expect(lint.errors('/a.ts: line 3, col 4, Error - no (rule)\n1 problem')).toHaveLength(1);
    expect(tsc.errors('src/a.ts(3,4): error TS2322: x\nother')).toHaveLength(1);
    const sum = test.summary?.(
      'Test Files  2 passed (2)\n     Tests  9 passed (9)\nLines       : 99% ( 1/1 )\nnoise',
    );
    expect(sum).toHaveLength(3);
  });
});

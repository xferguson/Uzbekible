// One quiet fast-gate command: task files → frame owners → lint → typecheck → test+coverage → build.
// Stops at the first failing step; passing runs print a handful of lines ending in `GATE OK`.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const MAX_ERROR_LINES = 60;

const lines = (s) => s.split(/\r?\n/);
// Colour is disabled via NO_COLOR/FORCE_COLOR below; this only catches stragglers.
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
const strip = (s) => s.replace(ANSI, '');
const pick = (output, re) => lines(strip(output)).filter((l) => re.test(l));
const tail = (output) =>
  lines(strip(output))
    .filter((l) => l.trim() !== '')
    .slice(-MAX_ERROR_LINES);

/** @type {import('./gate').GateStep[]} */
export const STEPS = [
  // The docs checks CI runs (docs/tasks consistency, every screen frame owned by one task): cheap, so first.
  {
    name: 'tasks',
    cmd: 'node',
    args: ['scripts/tasks.mjs', 'check'],
    errors: (o) => pick(o, /^error|^tasks:/),
  },
  {
    name: 'frames',
    cmd: 'node',
    args: ['scripts/tasks.mjs', 'frames'],
    errors: (o) => pick(o, /^error|^tasks:/),
  },
  {
    name: 'lint',
    cmd: 'eslint',
    args: ['.', '--format', 'compact'],
    errors: (o) => pick(o, /: line \d+, col \d+/),
  },
  {
    name: 'typecheck',
    cmd: 'tsc',
    args: ['--noEmit', '--pretty', 'false'],
    errors: (o) => pick(o, /\(\d+,\d+\): error|^error TS/),
  },
  {
    name: 'test',
    cmd: 'vitest',
    args: ['run', '--coverage', '--reporter=dot', '--coverage.reporter=text-summary'],
    errors: (o) => pick(o, /FAIL|Error|ERROR|❯ .*:\d+|expected|Coverage for|threshold|^\s+[-+] /),
    summary: (o) =>
      pick(
        o,
        /^\s*(Test Files|Tests)\s|Coverage summary|^={5,}$|^(Statements|Branches|Functions|Lines)\s+:/,
      ),
  },
  {
    name: 'build',
    cmd: 'vite',
    args: ['build', '--logLevel', 'error'],
    errors: (o) => pick(o, /error|Error|failed/i),
  },
];

/**
 * Runs the steps in order, stops at the first failure. Returns the exit code.
 * @param {{steps?: import('./gate').GateStep[], run: import('./gate').StepRunner,
 *   write: (line: string) => void, now?: () => number}} deps
 */
export async function runGate({ steps = STEPS, run, write, now = Date.now }) {
  for (const step of steps) {
    const t0 = now();
    const { code, output } = await run(step);
    const secs = ((now() - t0) / 1000).toFixed(1);
    if (code !== 0) {
      write(`✗ ${step.name} FAILED (${secs}s)`);
      const found = step.errors(output);
      const errs = (found.length > 0 ? found : tail(output)).slice(0, MAX_ERROR_LINES);
      for (const l of errs) write(l);
      write(`Re-run the single step for full output: ${[step.cmd, ...step.args].join(' ')}`);
      write('GATE FAILED');
      return 1;
    }
    write(`✓ ${step.name} (${secs}s)`);
    for (const l of step.summary?.(output) ?? []) write(l);
  }
  write('GATE OK');
  return 0;
}

/** Real runner: spawns the command (node_modules/.bin is on PATH under npm run) and buffers its output. */
export function spawnRunner(step) {
  return new Promise((resolve) => {
    const child = spawn(step.cmd, step.args, {
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('error', (e) => resolve({ code: 1, output: String(e) }));
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await runGate({ run: spawnRunner, write: (l) => console.log(l) });
}

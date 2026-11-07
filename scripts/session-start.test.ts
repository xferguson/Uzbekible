// @vitest-environment node
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = join(__dirname, 'session-start.sh');

let dir: string;
let bin: string;
let log: string;

function git(...args: string[]) {
  return spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
}

function run(extraEnv: Record<string, string> = {}) {
  return spawnSync('bash', [join(dir, 'scripts', 'session-start.sh')], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ...extraEnv },
  });
}

const npmCalls = () =>
  existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ss-'));
  bin = join(dir, '.fakebin');
  log = join(dir, 'npm.log');
  mkdirSync(bin);
  mkdirSync(join(dir, 'scripts'));
  copyFileSync(SCRIPT, join(dir, 'scripts', 'session-start.sh'));
  // fake npm: records the call and creates node_modules
  writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "$@" >> "${log}"\nmkdir -p node_modules\n`);
  chmodSync(join(bin, 'npm'), 0o755);
  writeFileSync(join(dir, 'package-lock.json'), '{"v":1}');
  git('init', '-q', '-b', 'main');
  git('-c', 'user.email=a@b', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('session-start.sh', () => {
  it('runs npm ci when node_modules is missing, then skips while the lockfile is unchanged', () => {
    expect(run().status).toBe(0);
    expect(npmCalls()).toEqual(['ci --no-audit --no-fund']);
    expect(run().status).toBe(0);
    expect(npmCalls()).toEqual(['ci --no-audit --no-fund']);
  });

  it('runs npm ci again when the lockfile changes', () => {
    run();
    writeFileSync(join(dir, 'package-lock.json'), '{"v":2}');
    run();
    expect(npmCalls()).toEqual(Array(2).fill('ci --no-audit --no-fund'));
  });

  it('exits 0 with a warning when npm ci fails', () => {
    writeFileSync(join(bin, 'npm'), '#!/bin/sh\nexit 1\n');
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/warning/i);
  });

  it('exits 0 when there is no origin to fetch from', () => {
    expect(run().status).toBe(0);
  });

  it('prints at most 20 lines including the branch', () => {
    const r = run();
    const lines = r.stdout.trim().split('\n');
    expect(lines.length).toBeLessThanOrEqual(20);
    expect(r.stdout).toContain('main');
  });

  it('exports PW_CHROMIUM_PATH via CLAUDE_ENV_FILE only when the path exists', () => {
    const envFile = join(dir, 'env');
    run({ CLAUDE_ENV_FILE: envFile, PW_CHROMIUM_DIR: join(dir, 'missing') });
    expect(existsSync(envFile) ? readFileSync(envFile, 'utf8') : '').not.toContain(
      'PW_CHROMIUM_PATH',
    );
    const chromium = join(dir, 'chromium');
    writeFileSync(chromium, '');
    run({ CLAUDE_ENV_FILE: envFile, PW_CHROMIUM_DIR: chromium });
    expect(readFileSync(envFile, 'utf8')).toContain(`PW_CHROMIUM_PATH=${chromium}`);
  });
});

#!/usr/bin/env node
// PostToolUse (Edit/Write): runs prettier --write on the edited file. Silent; never fails the tool call.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let path = '';
try {
  path = JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}
if (path) {
  const bin = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'node_modules',
    '.bin',
    'prettier',
  );
  spawnSync(bin, ['--write', '--log-level', 'silent', '--ignore-unknown', path], {
    stdio: 'ignore',
  });
}
process.exit(0);

#!/usr/bin/env node
// PreToolUse (Edit/Write): refuses package-lock.json edits, new .only/.skip in tests, lowered coverage thresholds.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const FOCUS = /\b(?:it|test|describe)\.(?:only|skip)\(/g;

const count = (text, re) => (text.match(re) ?? []).length;

/** The file's text after the tool call would apply. */
function resultingText(input, current) {
  const t = input.tool_input ?? {};
  if (typeof t.content === 'string') return t.content;
  if (current === null || typeof t.old_string !== 'string') return current ?? '';
  const next = t.new_string ?? '';
  return t.replace_all
    ? current.split(t.old_string).join(next)
    : current.replace(t.old_string, () => next);
}

function thresholdNumbers(text) {
  const m = /thresholds\s*:\s*\{([\s\S]*?)\n\s{6}\}/.exec(text);
  const out = {};
  if (!m) return out;
  for (const g of m[1].matchAll(/'([^']+)'\s*:\s*\{([^}]*)\}/g)) {
    for (const n of g[2].matchAll(/(\w+)\s*:\s*(\d+(?:\.\d+)?)/g))
      out[`${g[1]}.${n[1]}`] = Number(n[2]);
  }
  return out;
}

export function decideEdit(input, readCurrent) {
  const path = input?.tool_input?.file_path ?? '';
  if (!path) return { block: false };
  if (basename(path) === 'package-lock.json') {
    return {
      block: true,
      reason:
        'package-lock.json is generated: change package.json and run npm install, never edit the lock by hand.',
    };
  }
  const current = readCurrent(path);
  if (TEST_FILE.test(path)) {
    const before = current === null ? 0 : count(current, FOCUS);
    if (count(resultingText(input, current), FOCUS) > before) {
      return {
        block: true,
        reason: 'Do not add .only/.skip to tests: fix or delete the test instead.',
      };
    }
  }
  if (basename(path) === 'vite.config.ts' && current !== null) {
    const before = thresholdNumbers(current);
    const after = thresholdNumbers(resultingText(input, current));
    for (const [key, value] of Object.entries(before)) {
      if (!(key in after) || after[key] < value) {
        return {
          block: true,
          reason: `Coverage thresholds must never be lowered (${key} ${value} -> ${after[key] ?? 'removed'}).`,
        };
      }
    }
  }
  return { block: false };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }
  const result = decideEdit(input, (p) => {
    try {
      return readFileSync(p, 'utf8');
    } catch {
      return null;
    }
  });
  if (result.block) {
    process.stderr.write(`${result.reason}\n`);
    process.exit(2);
  }
}

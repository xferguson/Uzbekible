#!/usr/bin/env node
// PreToolUse (Bash): refuses history-rewriting git, pushes to main, and pushes without origin/main merged.
// Exit 2 + one-line reason on stderr blocks the call; silent exit 0 otherwise.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FORCE = /^(-f|--force(-with-lease|-if-includes)?(=.*)?|-[a-zA-Z]*f[a-zA-Z]*)$/;

/** Splits a shell command into simple commands, each a list of words. */
function segments(command) {
  return command
    .split(/&&|\|\||;|\||\n/)
    .map((s) => s.trim().split(/\s+/).filter(Boolean))
    .filter((w) => w.length > 0);
}

/** Drops leading `VAR=x` words and `git -C dir`/`-c k=v` options; returns [subcommand, ...args] or null. */
function gitArgs(words) {
  let i = 0;
  while (i < words.length && /^\w+=/.test(words[i])) i++;
  if (words[i] !== 'git') return null;
  i++;
  while (i < words.length && words[i].startsWith('-')) {
    i += words[i] === '-C' || words[i] === '-c' ? 2 : 1;
  }
  return words.slice(i);
}

function pushesToMain(args, currentBranch) {
  const positional = args.slice(1).filter((a) => !a.startsWith('-'));
  const refs = positional.slice(1);
  if (refs.length === 0) return currentBranch === 'main';
  return refs.some(
    (r) =>
      r === 'main' ||
      r.endsWith(':main') ||
      r === 'refs/heads/main' ||
      r === 'HEAD:refs/heads/main',
  );
}

export function decideBash(input, isMainMerged, currentBranch = () => '') {
  const command = input?.tool_input?.command ?? '';
  for (const words of segments(command)) {
    const args = gitArgs(words);
    if (!args || args.length === 0) continue;
    const [sub] = args;
    if (sub === 'rebase') {
      return {
        block: true,
        reason:
          'git rebase is not allowed: merge origin/main instead (git fetch origin main && git merge origin/main).',
      };
    }
    if (sub !== 'push') continue;
    if (args.some((a) => FORCE.test(a))) {
      return { block: true, reason: 'Force pushes are not allowed: merge, never rewrite history.' };
    }
    if (pushesToMain(args, currentBranch())) {
      return { block: true, reason: 'Do not push to main: push your task branch and open a PR.' };
    }
    if (!isMainMerged()) {
      return {
        block: true,
        reason:
          'origin/main is not merged: run `git fetch origin main && git merge origin/main` first.',
      };
    }
  }
  return { block: false };
}

function git(cwd, ...args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.exit(0);
  }
  const cwd = input.cwd || process.cwd();
  const result = decideBash(
    input,
    () => git(cwd, 'merge-base', '--is-ancestor', 'origin/main', 'HEAD').status === 0,
    () => git(cwd, 'branch', '--show-current').stdout.trim(),
  );
  if (result.block) {
    process.stderr.write(`${result.reason}\n`);
    process.exit(2);
  }
}

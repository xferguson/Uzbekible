// Task board: parses docs/tasks/<ID>-*.md and the README table (plain Node, no dependencies).
//   node scripts/tasks.mjs              compact table + "Ready next"
//   node scripts/tasks.mjs check        validate the task files and README (CI)
//   node scripts/tasks.mjs frames      exit 1 unless every docs/design/frames.json state is owned by one task (CI)
//   node scripts/tasks.mjs done <ID>    exit 1 unless task <ID> has Status "done" (CI, ready PRs)
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STATUSES = ['todo', 'in progress', 'in review', 'done', 'on hold'];
const FILE_RE = /^([A-Z]\d+)-.+\.md$/;

const row = (text, label) => {
  const m = text.match(new RegExp(`^\\|\\s*${label}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, 'm'));
  return m ? m[1] : undefined;
};

const parseIds = (cell) => [...new Set((cell ?? '').match(/\b[A-Z]\d+\b/g) ?? [])];

/** Reads every task file in `dir` and the README table. */
export function loadBoard(dir) {
  const tasks = new Map();
  for (const file of readdirSync(dir).sort()) {
    const m = FILE_RE.exec(file);
    if (!m) continue;
    const text = readFileSync(join(dir, file), 'utf8');
    tasks.set(m[1], {
      id: m[1],
      file,
      status: row(text, 'Status') ?? '',
      deps: parseIds(row(text, 'Depends on')),
      screens: [...(row(text, 'Screens owned') ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    });
  }
  let readme = [];
  try {
    const text = readFileSync(join(dir, 'README.md'), 'utf8');
    for (const line of text.split('\n')) {
      const m = /^\|\s*\[([A-Z]\d+)\]\([^)]*\)(\s*🔒)?\s*\|/.exec(line);
      if (m) readme.push({ id: m[1], locked: Boolean(m[2]) });
    }
  } catch {
    readme = [];
  }
  const locked = new Set(readme.filter((r) => r.locked).map((r) => r.id));
  for (const t of tasks.values()) t.locked = locked.has(t.id);
  return { tasks, readmeIds: readme.map((r) => r.id) };
}

export const isDone = (task) => task?.status === 'done';

/** Tasks with status `todo` whose dependencies are all `done`. */
export function readyNext({ tasks }) {
  return [...tasks.values()].filter(
    (t) => t.status === 'todo' && t.deps.every((d) => isDone(tasks.get(d))),
  );
}

/** Returns a list of problems (empty when the board is consistent). */
export function check({ tasks, readmeIds }) {
  const problems = [];
  const inReadme = new Set(readmeIds);
  for (const id of readmeIds) {
    if (!tasks.has(id))
      problems.push(`README lists ${id} but docs/tasks/${id}-*.md does not exist`);
  }
  for (const t of tasks.values()) {
    if (!inReadme.has(t.id)) problems.push(`${t.file} is not listed in the README table`);
    if (
      !STATUSES.some((s) => t.status === s || (s === 'on hold' && t.status.startsWith('on hold')))
    ) {
      problems.push(`${t.file}: Status "${t.status}" is not one of ${STATUSES.join(' | ')}`);
    }
    for (const d of t.deps) {
      if (!tasks.has(d)) problems.push(`${t.file}: depends on ${d}, which does not exist`);
    }
  }
  return problems;
}

/** Frame problems: every state in frames.json is claimed, and only once unless the earlier claimants are done. */
export function checkFrames({ tasks }, states) {
  const problems = [];
  const known = new Set(states);
  for (const t of tasks.values()) {
    for (const f of t.screens ?? []) {
      if (!known.has(f))
        problems.push(`${t.file}: owns frame "${f}", which is not in docs/design/frames.json`);
    }
  }
  for (const f of states) {
    const owners = [...tasks.values()].filter((t) => (t.screens ?? []).includes(f));
    if (owners.length === 0)
      problems.push(`frame "${f}" is claimed by no task (add it to a "Screens owned" row)`);
    const open = owners.filter((t) => !isDone(t));
    if (open.length > 1)
      problems.push(
        `frame "${f}" is claimed by several unfinished tasks: ${open.map((t) => t.id).join(', ')}`,
      );
  }
  return problems;
}

export function render(board) {
  const lines = ['ID   Status       Depends on'];
  for (const t of board.tasks.values()) {
    const id = `${t.id}${t.locked ? '🔒' : ''}`.padEnd(t.locked ? 3 : 4);
    lines.push(`${id} ${t.status.split(':')[0].padEnd(12)} ${t.deps.join(', ') || '-'}`);
  }
  lines.push('', 'Ready next:');
  const ready = readyNext(board);
  if (ready.length === 0) lines.push('  (nothing)');
  for (const t of ready)
    lines.push(`  ${t.id}${t.locked ? ' 🔒 (needs approval)' : ''}  ${t.file}`);
  return lines.join('\n');
}

function main(argv) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'tasks');
  const board = loadBoard(dir);
  const [cmd, arg] = argv;
  if (cmd === 'check') {
    const problems = check(board);
    for (const p of problems) console.error(`error: ${p}`);
    if (problems.length === 0) console.log(`tasks: ${board.tasks.size} task files OK`);
    return problems.length === 0 ? 0 : 1;
  }
  if (cmd === 'frames') {
    const file = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      'docs',
      'design',
      'frames.json',
    );
    const problems = checkFrames(board, Object.keys(JSON.parse(readFileSync(file, 'utf8')).states));
    for (const p of problems) console.error(`error: ${p}`);
    if (problems.length === 0) console.log('tasks: every frame has one owner');
    return problems.length === 0 ? 0 : 1;
  }
  if (cmd === 'done') {
    const t = board.tasks.get(arg);
    if (!t) {
      console.error(`error: no task file for ${arg}`);
      return 1;
    }
    if (!isDone(t)) {
      console.error(`error: ${t.file} has Status "${t.status}"; set it to "done" before merging`);
      return 1;
    }
    console.log(`${arg} is done`);
    return 0;
  }
  console.log(render(board));
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));

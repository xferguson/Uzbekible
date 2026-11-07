// PR evidence check (V3): UI changes need a mockup comparison in the PR description.
// Usage: node scripts/pr-evidence.mjs <changed-files> <pr-body-file>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const VISUAL = [/^src\/ui\//, /^src\/shell\//, /^src\/games\/[^/]+\/.+\.tsx$/, /\.css$/];

export const isVisualPath = (p) => VISUAL.some((re) => re.test(p));

/** Text of the "Screenshots" section with HTML comments removed ('' when absent). */
function screenshotsSection(body) {
  const m = /^##[ \t]+Screenshots[^\n]*\n([\s\S]*?)(?=^##[ \t]|(?![\s\S]))/im.exec(body ?? '');
  return m ? m[1].replace(/<!--[\s\S]*?-->/g, '').trim() : null;
}

const HELP =
  'UI files changed: add a mockup comparison under "## Screenshots / Artifact link" ' +
  '(run `npm run shots`, publish compare.html as an Artifact and link it), ' +
  'or for a non-visual change write `Visual change: none (<one-line reason>)`.';

export function checkEvidence(files, body) {
  const visual = files.filter(isVisualPath);
  if (visual.length === 0) return { ok: true, reason: 'no UI files changed' };
  const shown = visual.slice(0, 5).join(', ');
  const section = screenshotsSection(body);
  if (!section || /^n\/?a\b/i.test(section)) {
    return {
      ok: false,
      reason: `Screenshots section is empty or n/a (changed: ${shown}). ${HELP}`,
    };
  }
  const none = /visual change:\s*none\b[\s:(–—-]*(.*)/i.exec(section);
  if (none) {
    return none[1].replace(/[)\s]+$/, '').length >= 3
      ? { ok: true, reason: 'declared no visual change' }
      : { ok: false, reason: `"Visual change: none" needs a one-line reason. ${HELP}` };
  }
  if (/https?:\/\/\S*artifact\S*|shots\/compare/i.test(section))
    return { ok: true, reason: 'comparison named' };
  return {
    ok: false,
    reason: `Screenshots section names no comparison (changed: ${shown}). ${HELP}`,
  };
}

export function main(argv, write = console.log) {
  if (argv.length < 2) {
    write('usage: pr-evidence.mjs <changed-files> <pr-body-file>');
    return 2;
  }
  const files = readFileSync(argv[0], 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const body = readFileSync(argv[1], 'utf8');
  const r = checkEvidence(files, body);
  write(r.ok ? `pr-evidence OK: ${r.reason}` : `::error::pr-evidence: ${r.reason}`);
  return r.ok ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

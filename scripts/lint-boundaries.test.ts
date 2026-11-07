// @vitest-environment node
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: process.cwd() });

async function messages(filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => `${m.ruleId}: ${m.message}`);
}

const violates = async (filePath: string, code: string) =>
  (await messages(filePath, code)).some((m) => m.startsWith('boundaries/'));

describe('import boundaries (docs/architecture.md)', () => {
  it('core must not import ui', async () => {
    expect(await violates('src/core/text/x.ts', "import '@ui/index';\n")).toBe(true);
  });
  it('core must not import games, shell or design', async () => {
    expect(await violates('src/core/text/x.ts', "import '@games/types';\n")).toBe(true);
    expect(await violates('src/core/text/x.ts', "import '../../shell/App';\n")).toBe(true);
    expect(await violates('src/core/text/x.ts', "import '@design/index';\n")).toBe(true);
  });
  it('core may import core', async () => {
    expect(await violates('src/core/text/x.ts', "import '@core/random/index';\n")).toBe(false);
    expect(await violates('src/core/text/x.ts', "import '../random/index';\n")).toBe(false);
  });
  it('ui must not import games or shell, but may import core and design', async () => {
    expect(await violates('src/ui/x.ts', "import '@games/types';\n")).toBe(true);
    expect(await violates('src/ui/x.ts', "import '../shell/App';\n")).toBe(true);
    expect(await violates('src/ui/x.ts', "import '@core/text/index';\n")).toBe(false);
    expect(await violates('src/ui/x.ts', "import '@design/index';\n")).toBe(false);
  });
  it('design must not import the app', async () => {
    expect(await violates('src/design/x.ts', "import '@core/text/index';\n")).toBe(true);
    expect(await violates('src/design/x.ts', "import '@ui/index';\n")).toBe(true);
  });
  it('a game must not import another game', async () => {
    // juft is the existing game; qosh is a hypothetical sibling importing it.
    expect(await violates('src/games/qosh/x.ts', "import '../juft/index';\n")).toBe(true);
    expect(await violates('src/games/qosh/x.ts', "import '@games/juft/index';\n")).toBe(true);
    expect(await violates('src/games/juft/x.ts', "import './index';\n")).toBe(false);
  });
  it('a game may import core, ui, design, its own files and games/types', async () => {
    const f = 'src/games/juft/x.ts';
    expect(await violates(f, "import '@core/text/index';\n")).toBe(false);
    expect(await violates(f, "import '@ui/index';\n")).toBe(false);
    expect(await violates(f, "import '@design/index';\n")).toBe(false);
    expect(await violates(f, "import '@games/types';\n")).toBe(false);
    expect(await violates(f, "import './index';\n")).toBe(false);
  });
  it('shell may import games, ui, core and design', async () => {
    const f = 'src/shell/x.ts';
    expect(await violates(f, "import '@games/registry';\n")).toBe(false);
    expect(await violates(f, "import '@ui/index';\n")).toBe(false);
  });
  it('content scripts may import core only', async () => {
    expect(await violates('scripts/x.ts', "import '../src/ui/index';\n")).toBe(true);
    expect(await violates('scripts/x.ts', "import '../src/core/text/index';\n")).toBe(false);
  });
});

describe('jsx-a11y', () => {
  it('flags an img without alt', async () => {
    const m = await messages('src/ui/x.tsx', 'export const A = () => <img src="a.png" />;\n');
    expect(m.some((x) => x.startsWith('jsx-a11y/alt-text'))).toBe(true);
  });
});

describe('Node-runnable imports (Q1)', () => {
  const extensionless = async (filePath: string, code: string) =>
    (await messages(filePath, code)).some((m) => m.startsWith('no-restricted-syntax'));

  it('rejects extensionless relative imports in core and games', async () => {
    expect(await extensionless('src/core/text/x.ts', "import { a } from './index';\n")).toBe(true);
    expect(await extensionless('src/core/text/x.ts', "import { a } from '../random';\n")).toBe(
      true,
    );
    expect(await extensionless('src/core/text/x.ts', "export { a } from './rules';\n")).toBe(true);
    expect(await extensionless('src/core/text/x.ts', "export * from './rules';\n")).toBe(true);
    expect(
      await extensionless('src/games/juft/x.ts', "import type { A } from '../../core/session';\n"),
    ).toBe(true);
  });
  it('accepts explicit .ts extensions and package or alias specifiers', async () => {
    expect(await extensionless('src/core/text/x.ts', "import { a } from './index.ts';\n")).toBe(
      false,
    );
    expect(
      await extensionless('src/core/text/x.ts', "import { a } from '../random/index.ts';\n"),
    ).toBe(false);
    expect(await extensionless('src/games/juft/x.tsx', "import { a } from 'react';\n")).toBe(false);
  });
  it('does not apply outside core and games', async () => {
    expect(await extensionless('src/ui/x.ts', "import { a } from './index';\n")).toBe(false);
  });
});

describe('determinism ban (non-negotiable 5, Q4)', () => {
  const nondeterministic = async (filePath: string, code: string) =>
    (await messages(filePath, code)).some((m) =>
      /^no-restricted-(properties|globals): .*(Clock|Rng)/.test(m),
    );

  it('rejects Math.random, Date.now, setTimeout and setInterval in src', async () => {
    expect(await nondeterministic('src/games/x.ts', 'export const r = Math.random();\n')).toBe(
      true,
    );
    expect(await nondeterministic('src/core/text/x.ts', 'export const t = Date.now();\n')).toBe(
      true,
    );
    expect(await nondeterministic('src/ui/x.ts', 'setTimeout(() => {}, 1);\n')).toBe(true);
    expect(await nondeterministic('src/games/juft/x.test.ts', 'setInterval(() => {}, 1);\n')).toBe(
      true,
    );
    expect(await nondeterministic('src/ui/x.ts', 'window.setTimeout(() => {}, 1);\n')).toBe(true);
  });
  it('allows them in core/clock and shell', async () => {
    expect(
      await nondeterministic('src/core/clock/x.ts', 'setTimeout(() => {}, Date.now());\n'),
    ).toBe(false);
    expect(await nondeterministic('src/shell/x.ts', 'export const r = Math.random();\n')).toBe(
      false,
    );
  });
  it('does not apply outside src', async () => {
    expect(await nondeterministic('scripts/x.mjs', 'export const t = Date.now();\n')).toBe(false);
  });
});

describe('content scripts boundary (Q4)', () => {
  it('content/scripts may import core only', async () => {
    expect(await violates('content/scripts/x.ts', "import '../../src/ui/index';\n")).toBe(true);
    expect(await violates('content/scripts/x.ts', "import '../../src/games/types';\n")).toBe(true);
    expect(
      await violates('content/scripts/x.ts', "import '../../src/core/similarity/index.ts';\n"),
    ).toBe(false);
  });
});

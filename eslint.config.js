import js from '@eslint/js';
import globals from 'globals';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Import boundaries from docs/architecture.md:
//
//   shell ──► games/* ──► ui ──► design
//     │          │         │
//     └──────────┴─────────┴──►  core   (core imports nothing outside core)
//
// - core imports only core.
// - design imports only design. ui imports core and design, never games or shell.
// - games/<a> never imports games/<b>. Games import core, ui, design and games/types.
// - scripts (repo tooling) and content/scripts (content pipeline) import core only.
const elements = [
  { type: 'core', pattern: 'src/core' },
  { type: 'design', pattern: 'src/design' },
  { type: 'ui', pattern: 'src/ui' },
  // One element per game folder: src/games/<name>/**
  { type: 'game', pattern: 'src/games/*', capture: ['name'] },
  { type: 'shell', pattern: 'src/shell' },
  { type: 'dev', pattern: 'src/dev' },
  // Listed before `scripts` so content/scripts is not classified as repo tooling.
  { type: 'content-scripts', pattern: 'content/scripts' },
  { type: 'scripts', pattern: 'scripts' },
];

// Files that sit directly in src/games (types.ts, registry.ts) and src (main.tsx, test-setup.ts)
const files = [
  { pattern: 'src/games/*.{ts,tsx}', category: 'games-root' },
  { pattern: 'src/*.{ts,tsx}', category: 'app-root' },
];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'public/content'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,mjs}', 'content/scripts/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'boundaries/files': files,
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.json' } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: { element: { type: 'core' } }, allow: { to: { element: { type: 'core' } } } },
            {
              from: { element: { type: 'design' } },
              allow: { to: { element: { type: 'design' } } },
            },
            {
              from: { element: { type: 'ui' } },
              allow: { to: { element: { types: ['ui', 'core', 'design'] } } },
            },
            {
              from: { element: { type: 'game' } },
              allow: [
                {
                  to: {
                    element: {
                      type: 'game',
                      captured: { name: '{{ from.element.captured.name }}' },
                    },
                  },
                },
                { to: { file: { categories: 'games-root' } } },
                { to: { element: { types: ['core', 'ui', 'design'] } } },
              ],
            },
            {
              from: { file: { categories: 'games-root' } },
              allow: [
                { to: { file: { categories: 'games-root' } } },
                { to: { element: { types: ['game', 'core', 'ui', 'design'] } } },
              ],
            },
            {
              from: [
                { element: { types: ['shell', 'dev'] } },
                { file: { categories: 'app-root' } },
              ],
              allow: [
                { to: { file: { categories: ['games-root', 'app-root'] } } },
                { to: { element: { types: ['shell', 'dev', 'game', 'ui', 'core', 'design'] } } },
              ],
            },
            {
              from: { element: { type: 'scripts' } },
              allow: { to: { element: { types: ['scripts', 'core'] } } },
            },
            {
              from: { element: { type: 'content-scripts' } },
              allow: { to: { element: { types: ['content-scripts', 'core'] } } },
            },
          ],
        },
      ],
    },
  },
  {
    // Non-negotiable 5: time and randomness come from injected Clock and Rng, so games and tests
    // stay deterministic. Only the real Clock (core/clock) and the app shell touch the platform.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/core/clock/**', 'src/shell/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use an injected Rng (core/random).' },
        { object: 'Date', property: 'now', message: 'Use an injected Clock (core/clock).' },
        ...['window', 'globalThis', 'self'].flatMap((object) =>
          ['setTimeout', 'setInterval'].map((property) => ({
            object,
            property,
            message: 'Use an injected Clock (core/clock), not real timers.',
          })),
        ),
      ],
      'no-restricted-globals': [
        'error',
        { name: 'setTimeout', message: 'Use an injected Clock (core/clock), not real timers.' },
        { name: 'setInterval', message: 'Use an injected Clock (core/clock), not real timers.' },
      ],
    },
  },
  {
    // Q1: core and games must run under plain Node (--experimental-strip-types), which does not
    // resolve extensionless or directory imports. Write './x.ts' and './dir/index.ts'.
    files: ['src/core/**/*.{ts,tsx}', 'src/games/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].map((node) => ({
          selector: `${node}[source.value=/^\\.{1,2}(\\/.*)?$/]:not(${node}[source.value=/\\.(ts|tsx|css|json|mjs)$/])`,
          message:
            'Relative imports in core and games need an explicit extension (e.g. ./index.ts) so plain Node can run them.',
        })),
      ],
    },
  },
);

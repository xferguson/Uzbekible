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
// - scripts (content tooling) import core only.
const elements = [
  { type: 'core', pattern: 'src/core' },
  { type: 'design', pattern: 'src/design' },
  { type: 'ui', pattern: 'src/ui' },
  // One element per game folder: src/games/<name>/**
  { type: 'game', pattern: 'src/games/*', capture: ['name'] },
  { type: 'shell', pattern: 'src/shell' },
  { type: 'dev', pattern: 'src/dev' },
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
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,mjs}'],
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
            { from: { element: { type: 'design' } }, allow: { to: { element: { type: 'design' } } } },
            {
              from: { element: { type: 'ui' } },
              allow: { to: { element: { types: ['ui', 'core', 'design'] } } },
            },
            {
              from: { element: { type: 'game' } },
              allow: [
                { to: { element: { type: 'game', captured: { name: '{{ from.element.captured.name }}' } } } },
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
              from: [{ element: { types: ['shell', 'dev'] } }, { file: { categories: 'app-root' } }],
              allow: [
                { to: { file: { categories: ['games-root', 'app-root'] } } },
                { to: { element: { types: ['shell', 'dev', 'game', 'ui', 'core', 'design'] } } },
              ],
            },
            {
              from: { element: { type: 'scripts' } },
              allow: { to: { element: { types: ['scripts', 'core'] } } },
            },
          ],
        },
      ],
    },
  },
);

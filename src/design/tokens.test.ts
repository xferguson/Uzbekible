import { readFileSync } from 'node:fs';
import { applyTheme, colors, cssVariables, resolveTheme, spacing } from './tokens';

// Vitest blanks CSS imports, so read the files directly (tests run from the repo root).
const css = readFileSync('src/design/tokens.css', 'utf8');
const fonts = readFileSync('src/design/fonts.css', 'utf8');

describe('design tokens', () => {
  it('uses the approved D1 palette values', () => {
    expect(colors.light.gold).toBe('#B08423');
    expect(colors.dark.cobalt).toBe('#5B86E8');
    expect(colors.light['on-cobalt']).toBe('#FFFFFF');
    expect(colors.dark['on-deep']).toBe('#EEF2FA');
  });

  it('has the same token names in both themes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });

  it('keeps tokens.css in sync with tokens.ts for both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const [name, value] of Object.entries(colors[theme])) {
        expect(css.toLowerCase(), `${theme} ${name}`).toContain(
          `--color-${name}: ${value.toLowerCase()};`,
        );
      }
    }
  });

  it('sets the girih lattice strength per theme: 7% light, 10% dark (brief, 7-10%)', () => {
    const strengths = [...css.matchAll(/--pattern-strength:\s*([\d.]+);/g)].map((m) => m[1]);
    // light (:root), explicit dark, and the OS-dark fallback
    expect(strengths).toEqual(['0.07', '0.1', '0.1']);
  });

  it('serialises a theme to CSS variables', () => {
    const vars = cssVariables('light');
    expect(vars['--color-cobalt']).toBe('#1B3F8F');
    expect(vars['--space-4']).toBe('16px');
  });

  it('uses a 4-based spacing scale', () => {
    expect(Object.values(spacing).every((px) => px % 4 === 0)).toBe(true);
  });

  it('covers Latin, Cyrillic and Arabic scripts in the self-hosted font imports', () => {
    for (const needle of [
      'noto-sans/latin-ext-400',
      'noto-sans/cyrillic-ext-600',
      'noto-serif-display/latin-ext',
      'noto-naskh-arabic/arabic',
      'vazirmatn/arabic',
    ]) {
      expect(fonts).toContain(needle);
    }
  });
});

describe('theme', () => {
  it('sets data-theme for light and dark', () => {
    const el = document.createElement('div');
    applyTheme(el, 'dark');
    expect(el.dataset.theme).toBe('dark');
    applyTheme(el, 'light');
    expect(el.dataset.theme).toBe('light');
  });

  it('removes data-theme for system so prefers-color-scheme decides', () => {
    const el = document.createElement('div');
    applyTheme(el, 'dark');
    applyTheme(el, 'system');
    expect(el.hasAttribute('data-theme')).toBe(false);
  });

  it('resolves system from the media query', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
  });
});

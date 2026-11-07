/** Design tokens: the TypeScript source of truth, mirrored by tokens.css (a test keeps them in sync). */

export type ThemeName = 'light' | 'dark';
export type ThemeMode = ThemeName | 'system';

const light = {
  ground: '#F7F4EC',
  surface: '#FFFFFF',
  cobalt: '#1B3F8F',
  'cobalt-deep': '#0F2A66',
  turquoise: '#1FA3B5',
  'turquoise-pale': '#CDEFF2',
  gold: '#B08423',
  ochre: '#B5652B',
  crack: '#7A2E2E',
  text: '#13213F',
  'text-muted': '#4B5878',
  'on-cobalt': '#FFFFFF',
  'on-deep': '#FFFFFF',
} as const;

const dark: Record<keyof typeof light, string> = {
  ground: '#0B1A3A',
  surface: '#12254D',
  cobalt: '#5B86E8',
  'cobalt-deep': '#0A1838',
  turquoise: '#34C3D3',
  'turquoise-pale': '#164A57',
  gold: '#E2B54C',
  ochre: '#D88A4E',
  crack: '#E08A8A',
  text: '#EEF2FA',
  'text-muted': '#A8B4CF',
  'on-cobalt': '#0A1838',
  'on-deep': '#EEF2FA',
};

export const colors: Record<ThemeName, Record<keyof typeof light, string>> = { light, dark };

/** 4-based spacing scale in px. */
export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;

export const radii = { tile: 14, card: 16, pill: 999 } as const;

/** Font stacks keyed by the suffix of `--font-*`; `scriptMeta` refers to these through CSS variables. */
export const fontStacks = {
  ui: "'Noto Sans', system-ui, sans-serif",
  display: "'Noto Serif Display', 'Noto Sans', serif",
  naskh: "'Noto Naskh Arabic', 'Noto Sans', serif",
  fa: "'Vazirmatn', 'Noto Naskh Arabic', 'Noto Sans', sans-serif",
} as const;

/** CSS custom properties for a theme (colours plus the theme-independent scales). */
export function cssVariables(theme: ThemeName): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(colors[theme])) vars[`--color-${name}`] = value;
  for (const [k, px] of Object.entries(spacing)) vars[`--space-${k}`] = `${px}px`;
  for (const [k, px] of Object.entries(radii)) vars[`--radius-${k}`] = `${px}px`;
  for (const [k, stack] of Object.entries(fontStacks)) vars[`--font-${k}`] = stack;
  return vars;
}

/** Resolves a mode to a concrete theme; `system` follows `prefersDark`. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ThemeName {
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}

/** Sets `data-theme` on `root`; `system` removes it so the prefers-color-scheme rule applies. */
export function applyTheme(root: HTMLElement, mode: ThemeMode): void {
  if (mode === 'system') delete root.dataset.theme;
  else root.dataset.theme = mode;
}

/** Player settings in localStorage: source languages, Uzbek script, theme; plus download and reset helpers. */
import { createStore, type Store, type StoreOptions } from '@core/storage';
import type { SourceLang, UzScript } from '@core/text';
import type { Progress, RunBest } from '../progress';

export type Theme = 'system' | 'light' | 'dark';
export interface Settings {
  /** Enabled source languages, always non-empty, in canonical order. */
  languages: SourceLang[];
  script: UzScript;
  theme: Theme;
}

export const ALL_LANGUAGES: readonly SourceLang[] = ['tr', 'ru', 'fa', 'ar'];

const schema = {
  version: 1,
  default: { languages: [...ALL_LANGUAGES], script: 'uz-Latn', theme: 'system' } as Settings,
  validate: (v: unknown): v is Settings => {
    if (typeof v !== 'object' || v === null) return false;
    const s = v as Record<string, unknown>;
    return (
      Array.isArray(s.languages) &&
      s.languages.length > 0 &&
      s.languages.every((l) => ALL_LANGUAGES.includes(l as SourceLang)) &&
      (s.script === 'uz-Latn' || s.script === 'uz-Cyrl') &&
      (s.theme === 'system' || s.theme === 'light' || s.theme === 'dark')
    );
  },
};

export function createSettingsStore(options?: StoreOptions): Store<Settings> {
  return createStore('settings', schema, {}, options);
}

/** Toggles a source language. Returns false (and changes nothing) if it would leave none enabled. */
export function toggleLanguage(store: Store<Settings>, lang: SourceLang): boolean {
  const { languages } = store.get();
  const on = languages.includes(lang);
  if (on && languages.length === 1) return false;
  const next = ALL_LANGUAGES.filter((l) => (l === lang ? !on : languages.includes(l)));
  store.update((s) => ({ ...s, languages: next }));
  return true;
}

export const setScript = (store: Store<Settings>, script: UzScript): void =>
  store.update((s) => ({ ...s, script }));

export const setTheme = (store: Store<Settings>, theme: Theme): void =>
  store.update((s) => ({ ...s, theme }));

/** Explicit light/dark set `data-theme`; `system` removes it so the OS preference applies. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export interface DownloadEnv {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  createAnchor(): HTMLAnchorElement;
}

const browserEnv = (): DownloadEnv => ({
  createObjectURL: (b) => URL.createObjectURL(b),
  revokeObjectURL: (u) => URL.revokeObjectURL(u),
  createAnchor: () => document.createElement('a'),
});

/** Offers `content` to the player as a file download. */
export function downloadFile(
  name: string,
  content: string,
  type: string,
  env: DownloadEnv = browserEnv(),
): void {
  const url = env.createObjectURL(new Blob([content], { type }));
  const a = env.createAnchor();
  a.href = url;
  a.download = name;
  a.click();
  env.revokeObjectURL(url);
}

type Download = (name: string, content: string, type: string) => void;

/** Downloads the learning log as CSV or JSON. */
export function exportLog(
  log: { exportCsv(): string; exportJson(): string },
  format: 'csv' | 'json',
  download: Download = (n, c, t) => downloadFile(n, c, t),
): void {
  if (format === 'csv') download('uzbekible-log.csv', log.exportCsv(), 'text/csv');
  else download('uzbekible-log.json', log.exportJson(), 'application/json');
}

/** Sets every progress store back to its default and clears the learning log. Settings are kept. */
export function resetProgress(
  progress: readonly Store<Progress>[],
  log: { clear(): void },
  runBests: readonly Store<RunBest>[] = [],
): void {
  for (const store of progress) store.set({ unlocked: 1, best: {} });
  for (const store of runBests) store.set({ score: 0, streak: 0 });
  log.clear();
}

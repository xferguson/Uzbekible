import { createMemoryBackend } from '@core/storage';
import {
  applyTheme,
  createSettingsStore,
  downloadFile,
  setScript,
  setTheme,
  toggleLanguage,
} from './index';

const fresh = () => createSettingsStore({ backend: createMemoryBackend() });

describe('settings store', () => {
  it('defaults to all source languages, Latin, system theme', () => {
    expect(fresh().get()).toEqual({
      languages: ['tr', 'ru', 'fa', 'ar'],
      script: 'uz-Latn',
      theme: 'system',
    });
  });

  it('persists through the backend', () => {
    const backend = createMemoryBackend();
    setScript(createSettingsStore({ backend }), 'uz-Cyrl');
    expect(createSettingsStore({ backend }).get().script).toBe('uz-Cyrl');
  });

  it('falls back to defaults on invalid stored data', () => {
    const backend = createMemoryBackend();
    backend.setItem('uzbekible:v1:settings', JSON.stringify({ languages: [], script: 'x' }));
    expect(createSettingsStore({ backend }).get().languages).toHaveLength(4);
  });
});

describe('toggleLanguage', () => {
  it('turns a language off and on, keeping canonical order', () => {
    const s = fresh();
    toggleLanguage(s, 'ru');
    expect(s.get().languages).toEqual(['tr', 'fa', 'ar']);
    toggleLanguage(s, 'ru');
    expect(s.get().languages).toEqual(['tr', 'ru', 'fa', 'ar']);
  });

  it('cannot disable the last language', () => {
    const s = fresh();
    for (const l of ['ru', 'fa', 'ar'] as const) toggleLanguage(s, l);
    expect(toggleLanguage(s, 'tr')).toBe(false);
    expect(s.get().languages).toEqual(['tr']);
  });
});

describe('theme', () => {
  it('applyTheme sets data-theme for light/dark and removes it for system', () => {
    const root = document.createElement('html');
    applyTheme('dark', root);
    expect(root.dataset.theme).toBe('dark');
    applyTheme('system', root);
    expect(root.dataset.theme).toBeUndefined();
  });

  it('setTheme stores the choice', () => {
    const s = fresh();
    setTheme(s, 'light');
    expect(s.get().theme).toBe('light');
  });
});

describe('downloadFile', () => {
  it('creates a blob of the given type and clicks a download link', () => {
    const blobs: Blob[] = [];
    const click = vi.fn();
    const a = { click, href: '', download: '' } as unknown as HTMLAnchorElement;
    downloadFile('log.csv', 'a,b', 'text/csv', {
      createObjectURL: (b) => (blobs.push(b), 'blob:x'),
      revokeObjectURL: vi.fn(),
      createAnchor: () => a,
    });
    expect(blobs[0]?.type).toBe('text/csv');
    expect(blobs[0]?.size).toBe(3);
    expect(a.download).toBe('log.csv');
    expect(a.href).toBe('blob:x');
    expect(click).toHaveBeenCalledOnce();
  });
});

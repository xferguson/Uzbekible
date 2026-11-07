import { readFileSync } from 'node:fs';
import { scriptMeta, type TextLang } from '@core/text';
import { fontStacks } from '@design/tokens';
import { render, screen } from '@testing-library/react';
import { Gallery, isGalleryPath } from './Gallery';

describe('dev gallery', () => {
  it('matches the /dev/gallery route under any base', () => {
    expect(isGalleryPath('/dev/gallery')).toBe(true);
    expect(isGalleryPath('/Uzbekible/dev/gallery/')).toBe(true);
    expect(isGalleryPath('/Uzbekible/')).toBe(false);
  });

  it('lists motif components in both themes', () => {
    render(<Gallery />);
    expect(screen.getByRole('heading', { name: /gallery/i })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-theme="light"] svg').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-theme="dark"] svg').length).toBeGreaterThan(0);
  });

  it('defines every font stack that scriptMeta refers to', () => {
    const langs: TextLang[] = ['uz-Latn', 'uz-Cyrl', 'tr', 'ru', 'fa', 'ar'];
    for (const lang of langs) {
      const ref = /var\((--[\w-]+)\)/.exec(scriptMeta(lang).fontStack)?.[1];
      expect(ref, lang).toBeDefined();
      expect(Object.keys(fontStacks).map((k) => `--font-${k}`)).toContain(ref);
      expect(readFileSync('src/design/tokens.css', 'utf8')).toContain(`${ref}:`);
    }
  });
});

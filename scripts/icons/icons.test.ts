// @vitest-environment jsdom
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ICON_FILES,
  SAFE_ZONE_RADIUS,
  VIEWBOX,
  encodeIco,
  iconSvg,
  manifestIcons,
  starOutline,
  type IconVariant,
} from './icons';

const VARIANTS: IconVariant[] = ['any', 'maskable', 'favicon'];
const publicDir = join(process.cwd(), 'public');

function parse(svg: string) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  return doc.documentElement;
}

function pngSize(buf: Buffer) {
  expect(buf.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('iconSvg', () => {
  it.each(VARIANTS)('%s is well-formed, square SVG with a full-bleed opaque ground', (variant) => {
    const root = parse(iconSvg(variant));
    expect(root.tagName).toBe('svg');
    expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(root.getAttribute('viewBox')).toBe(`0 0 ${VIEWBOX} ${VIEWBOX}`);
    expect(root.getAttribute('width')).toBe(root.getAttribute('height'));
    const ground = root.querySelector('rect');
    expect(ground?.getAttribute('width')).toBe(String(VIEWBOX));
    expect(ground?.getAttribute('height')).toBe(String(VIEWBOX));
    expect(ground?.getAttribute('fill')).toBe('#F7F4EC');
  });

  it('draws the approved concept A: cobalt star, turquoise interlace, gold centre', () => {
    const svg = iconSvg('any');
    expect(svg).toContain('#1B3F8F');
    expect(svg).toContain('#1FA3B5');
    expect(svg).toContain('#C99A2E');
  });

  it('drops the hairline interlace from the favicon so it reads at 16 px', () => {
    expect(iconSvg('favicon')).not.toContain('#1FA3B5');
  });

  it('can render at an explicit pixel size', () => {
    const root = parse(iconSvg('any', 48));
    expect(root.getAttribute('width')).toBe('48');
    expect(root.getAttribute('height')).toBe('48');
  });
});

describe('maskable safe zone', () => {
  it('every star point of the maskable icon sits inside the 40% safe-zone circle', () => {
    const c = VIEWBOX / 2;
    for (const [x, y] of starOutline('maskable')) {
      expect(Math.hypot(x - c, y - c)).toBeLessThanOrEqual(SAFE_ZONE_RADIUS);
    }
  });

  it('star outline is symmetric under 45° rotation (8-fold)', () => {
    fc.assert(
      fc.property(fc.constantFrom<IconVariant>(...VARIANTS), (variant) => {
        const pts = starOutline(variant);
        const c = VIEWBOX / 2;
        const radii = pts.map(([x, y]) => Math.hypot(x - c, y - c));
        expect(pts).toHaveLength(16);
        for (let i = 0; i < 16; i++) {
          expect(radii[i]).toBeCloseTo(radii[(i + 2) % 16]!, 6);
        }
      }),
    );
  });
});

describe('encodeIco', () => {
  it('writes an ICO directory that points at each embedded PNG', () => {
    const a = Buffer.from('\x89PNG\r\n\x1a\nAAAA', 'latin1');
    const b = Buffer.from('\x89PNG\r\n\x1a\nBBBBBB', 'latin1');
    const ico = encodeIco([
      { size: 16, png: a },
      { size: 256, png: b },
    ]);
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(2);
    // entry 0
    expect(ico[6]).toBe(16);
    expect(ico.readUInt32LE(6 + 8)).toBe(a.length);
    const off0 = ico.readUInt32LE(6 + 12);
    expect(ico.subarray(off0, off0 + a.length)).toEqual(a);
    // entry 1: 256 is stored as 0
    expect(ico[22]).toBe(0);
    const off1 = ico.readUInt32LE(22 + 12);
    expect(ico.subarray(off1, off1 + b.length)).toEqual(b);
  });
});

describe('committed icon set (public/icons)', () => {
  it('the SVG master matches the generator', () => {
    expect(readFileSync(join(publicDir, 'icons/icon.svg'), 'utf8')).toBe(iconSvg('any'));
    expect(readFileSync(join(publicDir, 'icons/icon-maskable.svg'), 'utf8')).toBe(
      iconSvg('maskable'),
    );
    expect(readFileSync(join(publicDir, 'favicon.svg'), 'utf8')).toBe(iconSvg('favicon'));
  });

  it.each(ICON_FILES.filter((f) => f.file.endsWith('.png')))(
    '$file exists and is $size×$size',
    ({ file, size }) => {
      const path = join(publicDir, file);
      expect(existsSync(path)).toBe(true);
      expect(pngSize(readFileSync(path))).toEqual({ width: size, height: size });
    },
  );

  it('favicon.ico holds 16, 32 and 48 px images', () => {
    const ico = readFileSync(join(publicDir, 'favicon.ico'));
    expect(ico.readUInt16LE(4)).toBe(3);
    expect([ico[6], ico[22], ico[38]]).toEqual([16, 32, 48]);
  });
});

describe('manifestIcons', () => {
  it('lists PNG 48–512 for any, maskable 192 and 512, and the SVG master', () => {
    const icons = manifestIcons();
    const any = icons.filter((i) => i.purpose === 'any').map((i) => i.sizes);
    expect(any).toEqual(['48x48', '72x72', '96x96', '144x144', '192x192', '512x512', 'any']);
    const maskable = icons.filter((i) => i.purpose === 'maskable').map((i) => i.sizes);
    expect(maskable).toEqual(['192x192', '512x512']);
    for (const icon of icons) {
      expect(icon.src.startsWith('/')).toBe(false);
      expect(existsSync(join(publicDir, icon.src))).toBe(true);
    }
  });
});

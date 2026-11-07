// PWA icon set for Uzbekible: approved concept A (docs/design/brief.md, "Approved decisions"), the
// signature star on glaze white. Hand-built geometry ported from the D1 mockup because core/motif (K9)
// has not landed yet; once it does, starOutline/starChords/octagon should come from there.
//
// Pure module (no I/O) so it can be unit tested. scripts/icons/build.mjs writes the files.

export type IconVariant = 'any' | 'maskable' | 'favicon';
type Point = readonly [number, number];

export const VIEWBOX = 512;
/** Maskable icons keep their content within a circle of 40% of the icon size (W3C manifest spec). */
export const SAFE_ZONE_RADIUS = VIEWBOX * 0.4;

const COLOR = {
  ground: '#F7F4EC', // --color-ground (glaze white)
  cobalt: '#1B3F8F', // --color-cobalt
  turquoise: '#1FA3B5', // --color-turquoise
  gold: '#C99A2E', // gold centre as drawn in the approved concept A
} as const;

/** Outer radius of the star per variant, in viewBox units. */
const RADIUS: Record<IconVariant, number> = {
  any: 212, // fills the square for platforms that don't mask
  maskable: 190, // as approved in D1: tips stay inside the 204.8 safe zone
  favicon: 236, // as large as possible; reads at 16 px
};

const TAU = Math.PI * 2;
const C = VIEWBOX / 2;
const ROT = -Math.PI / 2 + Math.PI / 8; // flat top, as in the D1 signature star
const f = (n: number) => String(+n.toFixed(2));

/** Outline of the {8/2} khatam star: 16 points alternating outer radius R and inner radius r. */
export function starOutline(variant: IconVariant): Point[] {
  const R = RADIUS[variant];
  const n = 8;
  const k = 2;
  const r = (R * Math.cos((Math.PI * k) / n)) / Math.cos((Math.PI * (k - 1)) / n);
  return Array.from({ length: 2 * n }, (_, i) => {
    const a = ROT + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    return [C + rad * Math.cos(a), C + rad * Math.sin(a)] as const;
  });
}

function vertices(R: number, n: number, rot: number): Point[] {
  return Array.from(
    { length: n },
    (_, i) =>
      [C + R * Math.cos(rot + (i * TAU) / n), C + R * Math.sin(rot + (i * TAU) / n)] as const,
  );
}

const pathOf = (pts: Point[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';

/** The {8/3} interlace: chords from vertex i to i+3. */
function interlacePath(R: number): string {
  const v = vertices(R, 8, ROT);
  return v
    .map((p, i) => {
      const q = v[(i + 3) % 8]!;
      return `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`;
    })
    .join('');
}

/** SVG for one icon variant. `size` sets the width/height attributes (the viewBox is always 512). */
export function iconSvg(variant: IconVariant, size = VIEWBOX): string {
  const R = RADIUS[variant];
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}">`,
    `<title>Uzbekible</title>`,
    `<rect width="${VIEWBOX}" height="${VIEWBOX}" fill="${COLOR.ground}"/>`,
    `<path d="${pathOf(starOutline(variant))}" fill="${COLOR.cobalt}"/>`,
  ];
  if (variant !== 'favicon') {
    parts.push(
      `<path d="${interlacePath(R * 0.74)}" fill="none" stroke="${COLOR.turquoise}" stroke-width="${f((R * 9) / 190)}" stroke-linecap="round"/>`,
    );
  }
  parts.push(
    `<path d="${pathOf(vertices(R * (variant === 'favicon' ? 0.32 : 0.25), 8, -Math.PI / 2 + Math.PI / 8))}" fill="${COLOR.gold}"/>`,
    `</svg>`,
  );
  return parts.join('') + '\n';
}

export interface IconFile {
  /** Path relative to public/. */
  file: string;
  size: number;
  variant: IconVariant;
  purpose?: 'any' | 'maskable';
}

/** Every raster in the set. Files with a `purpose` go into the web app manifest. */
export const ICON_FILES: IconFile[] = [
  ...[48, 72, 96, 144, 192, 512].map((size) => ({
    file: `icons/icon-${size}.png`,
    size,
    variant: 'any' as const,
    purpose: 'any' as const,
  })),
  ...[192, 512].map((size) => ({
    file: `icons/icon-maskable-${size}.png`,
    size,
    variant: 'maskable' as const,
    purpose: 'maskable' as const,
  })),
  // iOS ignores the manifest and fills transparency with black; it rounds corners itself, so it gets
  // the padded (maskable) artwork.
  { file: 'icons/apple-touch-icon.png', size: 180, variant: 'maskable' },
];

/** Sizes packed into favicon.ico. */
export const FAVICON_ICO_SIZES = [16, 32, 48];

/** Vector sources written next to the rasters (path relative to public/). */
export const SVG_FILES: { file: string; variant: IconVariant }[] = [
  { file: 'icons/icon.svg', variant: 'any' },
  { file: 'icons/icon-maskable.svg', variant: 'maskable' },
  { file: 'favicon.svg', variant: 'favicon' },
];

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: 'any' | 'maskable';
}

/** The `icons` array of the web app manifest (srcs are relative to the manifest, i.e. the base URL). */
export function manifestIcons(): ManifestIcon[] {
  const png = (purpose: 'any' | 'maskable') =>
    ICON_FILES.filter((i) => i.purpose === purpose).map((i) => ({
      src: i.file,
      sizes: `${i.size}x${i.size}`,
      type: 'image/png',
      purpose,
    }));
  return [
    ...png('any'),
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ...png('maskable'),
  ];
}

/** Pack PNG images into an .ico file (PNG-compressed entries, supported since Windows Vista). */
export function encodeIco(images: { size: number; png: Uint8Array }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header[e] = size >= 256 ? 0 : size; // width (0 means 256)
    header[e + 1] = size >= 256 ? 0 : size; // height
    header[e + 2] = 0; // palette colours
    header[e + 3] = 0; // reserved
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => Buffer.from(i.png))]);
}

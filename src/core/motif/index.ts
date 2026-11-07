/** Pure girih geometry: plain point data. SVG rendering lives in `src/ui/motif`. */

export interface Point {
  x: number;
  y: number;
}

/** A polygon outline. `closed` paths join their last point back to the first (not repeated). */
export interface Path {
  points: Point[];
  closed: true;
}

export interface Rosette {
  /** The {n/2} star outline. */
  star: Path;
  /** n kite petals (centre, inner, outer, inner) that exactly tile the star. */
  petals: Path[];
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TileKind = 'stars' | 'hex';

export interface Tile {
  center: Point;
  path: Path;
}

/** Point at `angle` radians clockwise from 12 o'clock, radius `r`, around the origin. */
const polar = (angle: number, r: number): Point => ({
  x: r * Math.sin(angle),
  y: -r * Math.cos(angle),
});

const translate = (path: Path, c: Point): Path => ({
  closed: true,
  points: path.points.map((p) => ({ x: p.x + c.x, y: p.y + c.y })),
});

/**
 * Star polygon {n/k} as 2n alternating outer/inner vertices, first outer vertex at the top.
 * `rInner` defaults to where the {n/k} edges cross, so the star is the true star polygon.
 */
export function starPolygon(n: number, k: number, r: number, rInner?: number): Path {
  if (!Number.isInteger(n) || n < 3) throw new RangeError('n must be an integer >= 3');
  if (!Number.isInteger(k) || k < 1 || 2 * k >= n)
    throw new RangeError('k must satisfy 1 <= k < n/2');
  if (!(r > 0)) throw new RangeError('r must be positive');
  const inner =
    rInner ??
    (k === 1
      ? r * Math.cos(Math.PI / n)
      : (r * Math.cos((Math.PI * k) / n)) / Math.cos((Math.PI * (k - 1)) / n));
  if (!(inner > 0)) throw new RangeError('rInner must be positive');
  const step = Math.PI / n;
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    points.push(polar(2 * i * step, r), polar((2 * i + 1) * step, inner));
  }
  return { points, closed: true };
}

/** n-fold rosette: the {n/2} star split into n kite petals. */
export function rosette(n: number, r: number, rInner?: number): Rosette {
  const star = starPolygon(n, n >= 5 ? 2 : 1, r, rInner);
  const petals: Path[] = [];
  for (let i = 0; i < n; i++) {
    const p = (j: number): Point => star.points[(2 * i + j + 2 * n) % (2 * n)]!;
    petals.push({ points: [{ x: 0, y: 0 }, p(-1), p(0), p(1)], closed: true });
  }
  return { star, petals };
}

/**
 * Tiles whose centres lie inside `bounds`, on a lattice of pitch `cell`.
 * `stars`: 8-point stars on a square lattice. `hex`: hexagons on a staggered lattice.
 */
export function tilePattern(kind: TileKind, bounds: Bounds, cell: number): Tile[] {
  if (!(cell > 0)) throw new RangeError('cell must be positive');
  const tiles: Tile[] = [];
  const rowH = kind === 'hex' ? (cell * Math.sqrt(3)) / 2 : cell;
  const shape =
    kind === 'hex'
      ? {
          points: Array.from({ length: 6 }, (_, i) =>
            polar((i * Math.PI) / 3, cell / Math.sqrt(3)),
          ),
          closed: true as const,
        }
      : starPolygon(8, 2, cell / 2);
  for (let row = 0; bounds.y + row * rowH <= bounds.y + bounds.height; row++) {
    const offset = kind === 'hex' && row % 2 === 1 ? cell / 2 : 0;
    for (let col = 0; bounds.x + offset + col * cell <= bounds.x + bounds.width; col++) {
      const center = { x: bounds.x + offset + col * cell, y: bounds.y + row * rowH };
      tiles.push({ center, path: translate(shape, center) });
    }
  }
  return tiles;
}

import { starPolygon, type Path, type Point } from '@core/motif';

/** The signature star sits flat-topped: {8/2} rotated by half a step. */
const FLAT = Math.PI / 8;

const f = (n: number): string => String(Math.round(n * 100) / 100);

/** SVG path data for a closed polygon (`M…L…Z`). */
export function pathData(path: Path, at: Point = { x: 0, y: 0 }): string {
  return `M${path.points.map((p) => `${f(p.x + at.x)} ${f(p.y + at.y)}`).join('L')}Z`;
}

export function rotate(path: Path, angle: number): Path {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    closed: true,
    points: path.points.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c })),
  };
}

/** Regular octagon (or n-gon) with a vertex at `rot` radians clockwise from 12 o'clock. */
export function polygon(n: number, r: number, rot = Math.PI / n): Path {
  const points = Array.from({ length: n }, (_, i) => ({
    x: r * Math.sin((2 * Math.PI * i) / n),
    y: -r * Math.cos((2 * Math.PI * i) / n),
  }));
  return rotate({ closed: true, points }, rot);
}

export const khatam = (r: number): Path => rotate(starPolygon(8, 2, r), FLAT);

/** The {8/3} interlace as one closed star outline inside the khatam. */
export const interlace = (r: number): Path => rotate(starPolygon(8, 3, r), FLAT);

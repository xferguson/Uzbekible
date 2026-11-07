import fc from 'fast-check';
import { describe, it } from 'vitest';
import { rosette, starPolygon, tilePattern, type Point } from './index.ts';

const opts = { seed: 20240607, numRuns: 200 };
const EPS = 1e-6;

const rotate = (p: Point, a: number): Point => ({
  x: p.x * Math.cos(a) - p.y * Math.sin(a),
  y: p.x * Math.sin(a) + p.y * Math.cos(a),
});
const near = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < EPS;
const sameSet = (a: Point[], b: Point[]) =>
  a.length === b.length && a.every((p) => b.some((q) => near(p, q)));

const nk = fc
  .integer({ min: 5, max: 16 })
  .chain((n) => fc.tuple(fc.constant(n), fc.integer({ min: 2, max: Math.floor((n - 1) / 2) })));

describe('motif geometry properties', () => {
  it('starPolygon is n-fold rotationally symmetric', () => {
    fc.assert(
      fc.property(nk, fc.double({ min: 1, max: 100, noNaN: true }), ([n, k], r) => {
        const pts = starPolygon(n, k, r).points;
        return sameSet(
          pts.map((p) => rotate(p, (2 * Math.PI) / n)),
          pts,
        );
      }),
      opts,
    );
  });

  it('starPolygon points stay within the outer radius', () => {
    fc.assert(
      fc.property(nk, fc.double({ min: 1, max: 100, noNaN: true }), ([n, k], r) =>
        starPolygon(n, k, r).points.every((p) => Math.hypot(p.x, p.y) <= r + EPS),
      ),
      opts,
    );
  });

  it('rosette is n-fold symmetric and its petals are closed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 16 }),
        fc.double({ min: 1, max: 50, noNaN: true }),
        (n, r) => {
          const ro = rosette(n, r);
          const pts = ro.petals.flatMap((p) => p.points);
          const rotated = pts.map((p) => rotate(p, (2 * Math.PI) / n));
          return (
            ro.petals.every((p) => p.closed) && rotated.every((p) => pts.some((q) => near(p, q)))
          );
        },
      ),
      opts,
    );
  });

  it('tilePattern centres stay inside the bounds', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('stars', 'hex'),
        fc.integer({ min: -50, max: 50 }),
        fc.integer({ min: -50, max: 50 }),
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 5, max: 40 }),
        (kind, x, y, width, height, cell) =>
          tilePattern(kind, { x, y, width, height }, cell).every(
            (t) =>
              t.center.x >= x - EPS &&
              t.center.x <= x + width + EPS &&
              t.center.y >= y - EPS &&
              t.center.y <= y + height + EPS,
          ),
      ),
      opts,
    );
  });
});

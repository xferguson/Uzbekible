import { describe, expect, it } from 'vitest';
import { rosette, starPolygon, tilePattern } from './index';

const dist = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);

describe('starPolygon edge cases', () => {
  it('uses the {n/1} inner radius for k = 1', () => {
    const s = starPolygon(6, 1, 10);
    expect(Math.hypot(s.points[1]!.x, s.points[1]!.y)).toBeCloseTo(10 * Math.cos(Math.PI / 6));
  });
  it('rejects a non-positive explicit inner radius', () => {
    expect(() => starPolygon(8, 2, 10, 0)).toThrow(RangeError);
  });
  it('builds rosettes below five petals from a {n/1} star', () => {
    expect(rosette(4, 10).petals).toHaveLength(4);
  });
});

describe('starPolygon', () => {
  it('returns 2n alternating outer/inner vertices in a closed path', () => {
    const s = starPolygon(8, 2, 10);
    expect(s.closed).toBe(true);
    expect(s.points).toHaveLength(16);
    expect(dist(s.points[0]!)).toBeCloseTo(10);
    expect(dist(s.points[1]!)).toBeLessThan(10);
  });
  it('honours an explicit inner radius', () => {
    const s = starPolygon(8, 2, 10, 4);
    expect(dist(s.points[1]!)).toBeCloseTo(4);
  });
  it('puts the first vertex at the top (12 o’clock)', () => {
    const p = starPolygon(8, 2, 10).points[0]!;
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-10);
  });
  it('derives the {8/2} inner radius where the edges cross', () => {
    // r * cos(pi*k/n) / cos(pi*(k-1)/n)
    const s = starPolygon(8, 2, 1);
    expect(dist(s.points[1]!)).toBeCloseTo(Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8));
  });
  it('rejects invalid input', () => {
    expect(() => starPolygon(2, 1, 1)).toThrow();
    expect(() => starPolygon(8, 0, 1)).toThrow();
    expect(() => starPolygon(8, 4, 1)).toThrow();
    expect(() => starPolygon(8, 2, -1)).toThrow();
  });
});

describe('rosette', () => {
  it('has n kite petals around the centre, each a closed path', () => {
    const r = rosette(8, 10);
    expect(r.petals).toHaveLength(8);
    for (const p of r.petals) {
      expect(p.closed).toBe(true);
      expect(p.points).toHaveLength(4);
    }
    expect(r.star.points).toHaveLength(16);
  });
});

describe('tilePattern', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 60 };
  it('covers the bounds with tiles whose centres lie within them', () => {
    for (const kind of ['stars', 'hex'] as const) {
      const tiles = tilePattern(kind, bounds, 20);
      expect(tiles.length).toBeGreaterThan(0);
      for (const t of tiles) {
        expect(t.center.x).toBeGreaterThanOrEqual(0);
        expect(t.center.x).toBeLessThanOrEqual(100);
        expect(t.center.y).toBeGreaterThanOrEqual(0);
        expect(t.center.y).toBeLessThanOrEqual(60);
        expect(t.path.closed).toBe(true);
      }
    }
  });
  it('is deterministic', () => {
    expect(tilePattern('hex', bounds, 20)).toEqual(tilePattern('hex', bounds, 20));
  });
  it('rejects non-positive cell sizes', () => {
    expect(() => tilePattern('stars', bounds, 0)).toThrow();
  });
});

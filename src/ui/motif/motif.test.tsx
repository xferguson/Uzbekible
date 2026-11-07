import { render } from '@testing-library/react';
import { PatternBg, RosetteBand, Star8 } from './index';

const paths = (c: HTMLElement) => Array.from(c.querySelectorAll('path'));

describe('motif components', () => {
  it('Star8 is decorative and every path is closed', () => {
    const { container } = render(<Star8 size={64} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    const outline = paths(container)[0]!;
    expect(outline.getAttribute('d')).toMatch(/^M.*Z$/);
    expect(svg.getAttribute('width')).toBe('64');
  });

  it('Star8 has outline, interlace and octagon centre', () => {
    const { container } = render(<Star8 />);
    expect(paths(container)).toHaveLength(3);
    const outline = paths(container)[0]!.getAttribute('d')!;
    expect(outline.split('L')).toHaveLength(16);
  });

  it('Star8 accepts an outline-only variant', () => {
    const { container } = render(<Star8 variant="outline" />);
    expect(paths(container)).toHaveLength(1);
    expect(paths(container)[0]).toHaveAttribute('fill', 'none');
  });

  it('RosetteBand is decorative and repeats stars across its width', () => {
    const { container } = render(<RosetteBand width={300} height={40} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const stars = container.querySelectorAll('[data-motif="band-star"]');
    expect(stars.length).toBeGreaterThanOrEqual(Math.floor(300 / (40 * 1.25)));
    for (const p of paths(container)) expect(p.getAttribute('d')).toMatch(/Z$/);
  });

  it('PatternBg is decorative, closed-path lattice with strength opacity', () => {
    const { container } = render(<PatternBg strength={0.08} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('pattern')).not.toBeNull();
    expect(paths(container).length).toBeGreaterThan(0);
    for (const p of paths(container)) expect(p.getAttribute('d')).toMatch(/Z$/);
    expect(svg.style.opacity).toBe('0.08');
  });

  it('PatternBg clamps strength to the 7–10% brief range ceiling of 0.1 by default', () => {
    const { container } = render(<PatternBg />);
    const o = Number(container.querySelector('svg')!.style.opacity);
    expect(o).toBeGreaterThanOrEqual(0.07);
    expect(o).toBeLessThanOrEqual(0.1);
  });

  it('PatternBg uses unique pattern ids per instance', () => {
    const { container } = render(
      <>
        <PatternBg />
        <PatternBg />
      </>,
    );
    const ids = Array.from(container.querySelectorAll('pattern')).map((p) => p.id);
    expect(new Set(ids).size).toBe(2);
  });
});

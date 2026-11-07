import { useId } from 'react';
import { khatam, pathData } from './geometry';

export interface PatternBgProps {
  /** Line strength, 0.07–0.10 per the brief (default 0.08). Never place behind running text. */
  strength?: number;
  /** Lattice pitch in px. */
  cell?: number;
  className?: string;
}

/** Star-and-cross line lattice that fills its container. Decorative, low contrast. */
export function PatternBg({ strength = 0.08, cell = 64, className }: PatternBgProps) {
  const id = `pattern-${useId().replace(/:/g, '')}`;
  const h = cell / 2;
  const d = [
    pathData(khatam(h), { x: h, y: h }),
    ...[
      [0, 0],
      [cell, 0],
      [0, cell],
      [cell, cell],
    ].map(([x, y]) => pathData(khatam(h), { x: x!, y: y! })),
  ].join('');
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      style={{ opacity: strength }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={id} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <path d={d} fill="none" stroke="var(--color-cobalt)" strokeWidth={1.2} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

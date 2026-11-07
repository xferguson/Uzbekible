import { khatam, interlace, pathData, polygon } from './geometry';

export interface RosetteBandProps {
  width?: number;
  height?: number;
  className?: string;
}

const STEP = 1.25;

/** Horizontal band: alternating stars in octagon frames with gold diamonds between, on cobalt-deep. */
export function RosetteBand({ width = 320, height = 40, className }: RosetteBandProps) {
  const step = height * STEP;
  const count = Math.ceil(width / step) + 1;
  const r = height * 0.36;
  const cy = height / 2;
  const items = Array.from({ length: count }, (_, i) => {
    const cx = i * step + step / 2;
    const odd = i % 2 === 1;
    return (
      <g key={i} data-motif="band-star">
        <path
          d={pathData(polygon(8, r * 1.12), { x: cx, y: cy })}
          fill="none"
          stroke="var(--color-turquoise)"
          strokeWidth={1.2}
          opacity={0.6}
        />
        <path
          d={pathData(khatam(r), { x: cx, y: cy })}
          fill={odd ? 'var(--color-turquoise)' : 'var(--color-on-deep)'}
        />
        <path
          d={pathData(interlace(r * 0.74), { x: cx, y: cy })}
          fill="none"
          stroke={odd ? 'var(--color-on-deep)' : 'var(--color-cobalt)'}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <path
          d={pathData(polygon(4, height * 0.12, 0), { x: cx + step / 2, y: cy })}
          fill="var(--color-gold)"
        />
      </g>
    );
  });
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect width={width} height={height} fill="var(--color-cobalt-deep)" />
      <rect y={1.5} width={width} height={1.5} fill="var(--color-gold)" />
      <rect y={height - 3} width={width} height={1.5} fill="var(--color-gold)" />
      {items}
    </svg>
  );
}

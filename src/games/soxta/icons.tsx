/** Soxta's small drawings, after mockup J4: chevrons, badges, cracks, the clue octagon, HUD marks. Decorative. */
import { khatam, pathData, polygon } from '../../ui/motif/geometry.ts';

/** Double chevron pointing to the side a swipe goes. */
export function Go({ side, className }: { side: 'left' | 'right'; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d={
          side === 'left'
            ? 'M17 6 L8 15 L17 24M25 6 L16 15 L25 24'
            : 'M13 6 L22 15 L13 24M5 6 L14 15 L5 24'
        }
      />
    </svg>
  );
}

const BADGE = {
  ok: ['var(--color-gold)', 'var(--color-text)', 'M8 14.5 L12.5 19 L20 9.5'],
  bad: ['var(--color-crack)', 'var(--color-ground)', 'M9 9 L19 19 M19 9 L9 19'],
  time: ['var(--color-ochre)', 'var(--color-ground)', 'M14 7.5 V14 L18.5 16.5'],
} as const;

/** Round badge on a tile corner or in the reveal header: check, cross or clock. */
export function Badge({ kind, className }: { kind: keyof typeof BADGE; className?: string }) {
  const [fill, ink, d] = BADGE[kind];
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <circle
        cx="14"
        cy="14"
        r="12.5"
        fill={fill}
        stroke="var(--color-cobalt-deep)"
        strokeWidth={1.6}
      />
      <path
        d={d}
        fill="none"
        stroke={ink}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CRACKS =
  'M50 0 L46 14 L54 24 L44 38 L50 60 M46 14 L30 10 L18 18 M54 24 L72 20 L86 30 M44 38 L28 44 L14 40 M50 48 L64 52';

/** Thin crack lines across a broken tile; they stretch with the tile but keep their weight. */
export function Cracks({ className }: { className?: string }) {
  return (
    <svg
      data-testid="cracks"
      className={className}
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={CRACKS}
        fill="none"
        stroke="var(--color-crack)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Gold star outline behind a correct tile (the "bloom"). */
export function StarBloom({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="-50 -50 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={pathData(khatam(50))}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The clue medallion: surface-filled octagon, gold rim, dashed turquoise inner ring. */
export function ClueOctagon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-50 -50 100 100" aria-hidden="true">
      <path
        d={pathData(polygon(8, 48))}
        fill="var(--color-surface)"
        stroke="var(--color-gold)"
        strokeWidth={3.5}
      />
      <path
        d={pathData(polygon(8, 40))}
        fill="none"
        stroke="var(--color-turquoise)"
        strokeWidth={1.6}
        strokeDasharray="3 3"
      />
    </svg>
  );
}

/** Small eight-point star (score mark, multiplier chip). */
export function MiniStar({ fill, className }: { fill: string; className?: string }) {
  return (
    <svg className={className} viewBox="-12 -12 24 24" aria-hidden="true">
      <path d={pathData(khatam(11))} fill={fill} />
    </svg>
  );
}

/** Small octagon (streak mark). */
export function MiniOctagon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-22 -22 44 44" aria-hidden="true">
      <path
        d={pathData(polygon(8, 21))}
        fill="var(--color-turquoise)"
        stroke="var(--color-cobalt-deep)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </svg>
  );
}

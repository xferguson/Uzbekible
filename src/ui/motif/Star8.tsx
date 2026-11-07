import { interlace, khatam, pathData, polygon } from './geometry';

export interface Star8Props {
  size?: number;
  /** `full`: khatam, interlace and gold centre. `outline`: the {8/2} outline only (match cue, selected corner). */
  variant?: 'full' | 'outline';
  className?: string;
}

/** The signature star: {8/2} khatam, {8/3} turquoise interlace and a gold octagon centre. Decorative. */
export function Star8({ size = 48, variant = 'full', className }: Star8Props) {
  const outline = pathData(khatam(48));
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {variant === 'outline' ? (
        <path
          d={outline}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path d={outline} fill="var(--color-cobalt)" />
          <path
            d={pathData(interlace(36))}
            fill="none"
            stroke="var(--color-turquoise)"
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <path d={pathData(polygon(8, 12))} fill="var(--color-gold)" />
        </>
      )}
    </svg>
  );
}

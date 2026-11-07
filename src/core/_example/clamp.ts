/** Example module showing the core test conventions; copy the pattern, not the code. */
export function clamp(x: number, lo: number, hi: number): number {
  if (lo > hi) throw new RangeError(`clamp: lo (${lo}) > hi (${hi})`);
  return Math.min(Math.max(x, lo), hi);
}

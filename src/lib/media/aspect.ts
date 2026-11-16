/** Aspect-ratio helpers for MediaFrame (rule 50): uploads keep their own ratio, never cropped or stretched. */

/** Frames stop at 9:21 and 21:9; a more extreme photo is still shown whole, letterboxed inside. */
export const FRAME_MIN = 9 / 21;
export const FRAME_MAX = 21 / 9;
/** Placeholder ratio until a photo without known dimensions has loaded. */
export const PLACEHOLDER_RATIO = 4 / 3;

/** width ÷ height, or null when either side is missing, zero or not a finite number. */
export function ratioOf(width: number | null | undefined, height: number | null | undefined): number | null {
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return width / height;
}

/** The frame's ratio: the photo's own, kept between 9:21 and 21:9. */
export function clampRatio(ratio: number, min = FRAME_MIN, max = FRAME_MAX): number {
  return Math.min(max, Math.max(min, ratio));
}

/** A CSS `aspect-ratio` value ("1.7778"), rounded so it is stable between renders. */
export function cssAspect(ratio: number): string {
  return String(Math.round(ratio * 10000) / 10000);
}

/** The frame ratio for known or measured dimensions, or the placeholder until they exist. */
export function frameRatio(width?: number | null, height?: number | null): number {
  const ratio = ratioOf(width, height);
  return ratio === null ? PLACEHOLDER_RATIO : clampRatio(ratio);
}

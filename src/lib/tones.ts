/** Text colours and section surfaces, mapped to globals.css colour tokens (rule 8). */
export const textTones = {
  ink: "text-gray-950",
  strong: "text-strong",
  muted: "text-gray-600",
  sub: "text-sub",
  rose: "text-rose",
  roseBright: "text-rose-bright",
  roseDeep: "text-rose-deep",
  roseSoft: "text-rose-soft",
  white: "text-white",
  iconSoft: "text-icon-soft",
  iconDark: "text-icon-dark",
  gray900: "text-gray-900",
  error: "text-error",
  success: "text-success",
  notice: "text-notice",
  iconMuted: "text-icon-muted",
  gray400: "text-gray-400",
  /** Takes the colour of its control (field states). */
  inherit: "text-inherit",
} as const;

export type TextTone = keyof typeof textTones;

export const surfaces = {
  white: "bg-white",
  blush: "bg-blush",
  mist: "bg-mist",
  roseLight: "bg-rose-light",
  rose: "bg-rose",
  night: "bg-night",
  hero: "bg-hero",
} as const;

export type Surface = keyof typeof surfaces;

import type { Destination } from "@/lib/routes";

/** Hugeicons slugs available in public/icons (rule 13). */
export type IconName =
  | "add-01"
  | "arrow-down-01"
  | "arrow-left-02"
  /** Heroicons micro chevron — the one non-Hugeicons glyph, used by the Figma phone field. */
  | "chevron-down-micro"
  | "arrow-up-right-01"
  | "calendar-03"
  | "favourite"
  | "location-01"
  | "message-01"
  | "minus-sign"
  | "shield-01"
  | "sparkles"
  | "square-lock-02"
  | "tick-02";

export type Action = {
  label: string;
  to: Destination;
  icon?: IconName;
};

export type ImageAsset = {
  src: string;
  /** Empty string marks a decorative image. */
  alt: string;
  width: number;
  height: number;
};

/**
 * Display copy. `\n` forces a line break at desktop widths and `*text*`
 * marks the rose highlight used in headings ("hello.", "clarity.").
 */
export type RichCopy = string;

export type Intro = {
  eyebrow: string;
  title: RichCopy;
  description?: string;
};

export type IconItem = {
  icon: IconName;
  title: string;
  description: string;
};

import type { Destination } from "@/lib/routes";

/** Hugeicons slugs available in public/icons (rule 13). */
export type IconName =
  | "add-01"
  | "arrow-down-01"
  | "arrow-left-02"
  /** Remix arrows on the Align UI date picker (as exported from Figma). */
  | "arrow-left-s-line"
  | "arrow-right-s-line"
  /** Heroicons micro chevron — the one non-Hugeicons glyph, used by the Figma phone field. */
  | "chevron-down-micro"
  | "arrow-up-right-01"
  | "book-open-01"
  | "bubble-chat"
  | "calendar-03"
  | "cancel-01"
  | "camera-01"
  | "checkmark-circle-02"
  | "clock-01"
  | "close-line"
  | "coffee-01"
  | "favourite"
  /** Web header navigation glyphs: Flowbite, Mingcute, MDI, Material Symbols and Tabler, as drawn in W04 (not Hugeicons). */
  | "flowbite-fire-solid"
  | "game-controller-03"
  | "image-add-01"
  | "location-01"
  | "material-auto-stories"
  | "mdi-chat"
  | "message-01"
  | "mingcute-love-fill"
  | "minus-sign"
  | "music-note-01"
  | "notification-02"
  | "paint-board"
  | "search-01"
  | "shield-01"
  | "sparkles"
  | "square-lock-02"
  | "star"
  | "tabler-bell-filled"
  | "tick-02"
  | "user-circle";

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

import { typeScale } from "./type-scale";

/** Control and layout sizes from Figma (rule 8). */
export const buttonSizes = {
  /** Landing nav actions — 48px, 16/24 bold */
  md: `${typeScale.text16Bold} h-12 gap-4.5 px-6 rounded-12`,
  /** Landing CTAs — 54px, 16/24 bold */
  lg: `${typeScale.text16Bold} h-13.5 gap-4.5 px-6 rounded-12`,
  /** Align UI buttons on the solid nav and legal pages — 56px, 16/20 bold */
  xl: `${typeScale.button16} h-14 gap-1 px-7 rounded-12`,
  /** Authentication pill — 56px, full radius; label weight comes from the variant. */
  pill: "h-14 gap-3 px-8 rounded-full",
  /** Onboarding "Back" — 44px outline pill with a 24px arrow. */
  back: `${typeScale.text14SemiboldRelaxed} h-11 gap-2 px-3 rounded-full`,
  /** Onboarding secondary text action ("Enter location manually") — 44px. */
  text: `${typeScale.text16Semibold} h-11 px-8 rounded-full`,
  /** Portal pill with a 14/22 bold label (decision controls, card actions). */
  pillCompact: `${typeScale.text14BoldRelaxed} h-14 px-8 max-sm:px-3 rounded-full`,
  /** Portal screen action — 56px pill, 16/24 bold. */
  portalPill: `${typeScale.text16Bold} h-14 px-8 max-sm:px-4 rounded-full`,
  /** Align UI "Buttons [1.1]" small (PHOTO-MANAGE "Upload", "Replace"): 32px, 14/20 medium. */
  compact: `${typeScale.text14Medium} h-8 px-2.5 rounded-8`,
  /** Round 44px icon button (LIKES Pass / Like); the label is its aria-label. */
  icon: "size-11 shrink-0 rounded-full p-0",
} as const;

export type ButtonSize = keyof typeof buttonSizes;

/**
 * Fixed widths the Align UI buttons use in Figma. Each fixed width also carries
 * "max-w-full whitespace-normal text-center": it keeps the Figma width where there is room and
 * shrinks (wrapping its label) inside a narrower container, e.g. 360px at 400 % zoom (rule 48).
 */
export const buttonWidths = {
  auto: "",
  login: "w-30 max-w-full whitespace-normal text-center",
  signup: "w-40 max-w-full whitespace-normal text-center",
  back: "w-52 max-w-full whitespace-normal text-center",
  full: "w-full",
  /** Onboarding action row: 112px Back, 240px primary (shrinks beside Back on phones). */
  setupBack: "w-28",
  setupPrimary: "w-60 min-w-0 max-w-full max-sm:shrink max-sm:px-4",
  /** Portal decision row: 136 / 136 / 152 of the 448px deck, scaling together on narrow screens. */
  decision: "min-w-0 flex-[136_1_0]",
  superLike: "min-w-0 flex-[152_1_0]",
  /** Portal fixed widths from the W04 frames. */
  portalAction: "w-45 max-w-full whitespace-normal text-center",
  findMore: "w-54 max-w-full whitespace-normal text-center",
  notifyAction: "w-56 max-w-full whitespace-normal text-center",
  summaryAction: "w-60 max-w-full whitespace-normal text-center",
  profileAction: "w-75 max-w-full whitespace-normal text-center",
  /** W05 screen action slot: 200px, wider for long labels. */
  actionSlot: "min-w-50 max-sm:w-full",
  /** Chat composer "Send". */
  send: "w-20 max-w-full whitespace-normal text-center",
  passAction: "w-50 max-w-full whitespace-normal text-center",
  /** W09 PROFILE "Settings" beside the 160px "Edit profile". */
  settingsAction: "w-35 max-w-full whitespace-normal text-center",
  /** Equal share of a portal action row; full width when the row stacks on phones. */
  grow: "w-full min-w-0 sm:w-auto sm:flex-1",
} as const;

export type ButtonWidth = keyof typeof buttonWidths;

export const iconSizes = {
  12: "size-3",
  16: "size-4",
  18: "size-4.5",
  20: "size-5",
  24: "size-6",
  28: "size-7",
  32: "size-8",
  40: "size-10",
  48: "size-12",
  /** W09 TRUST shield. */
  56: "size-14",
  64: "size-16",
  /** BLOCK dialog shield. */
  120: "size-30",
} as const;

/** 56px form control (auth + onboarding "Form / Input control"): states from Figma. */
export const fieldControl = {
  base: `${typeScale.text14Relaxed} flex h-14 w-full items-center gap-3 rounded-12 border bg-white px-4 text-strong transition-colors focus-within:border-rose`,
  default: "border-input-line",
  error: "border-error",
  disabled: "border-input-line bg-gray-100 text-gray-400",
} as const;

export type FieldState = Exclude<keyof typeof fieldControl, "base">;

/** Align UI compact select (48px, soft hairline) and textarea, used in W06 dialogs and forms. */
export const softControl = {
  select: `${typeScale.text14} flex h-12 w-full items-center gap-2 rounded-10 border border-soft-line bg-white py-2.5 pr-2.5 pl-3 text-strong shadow-xs`,
  area: `${typeScale.text14} h-28 w-full resize-none rounded-12 border border-soft-line bg-white py-2.5 pr-2.5 pl-3 text-strong shadow-xs outline-none placeholder:text-gray-400 focus:border-rose`,
} as const;

/** The bare input inside a field control: takes the control's colour, grey placeholder. */
export const fieldInput = "h-full min-w-0 flex-1 bg-transparent text-inherit outline-none placeholder:text-gray-400 disabled:cursor-not-allowed";

export type IconSize = keyof typeof iconSizes;

/**
 * Tallest a MediaFrame may grow (CSS lengths, rule 50): a tall upload is capped by height and
 * narrows to keep its ratio, so a 9:16 story never fills more than this of the screen.
 */
export const mediaHeights = {
  /** Story photo on STORY-DETAIL / STORY-MINE. */
  story: "min(calc(var(--svh) * 0.7), 40rem)",
  /** Story card in the feed. */
  card: "min(calc(var(--svh) * 0.5), 26rem)",
  /** Photo sent in a conversation. */
  attachment: "min(calc(var(--svh) * 0.5), 20rem)",
  /** Preview before uploading or sending. */
  preview: "min(calc(var(--svh) * 0.6), 32rem)",
} as const;

export type MediaHeight = keyof typeof mediaHeights;

/** Chat bubbles (Phase 13): as wide as their text up to 80 % of the pane (36rem at most); a 20px capsule with a 6px tail toward the sender. */
export const chatBubble = {
  width: "max-w-[min(80%,36rem)]",
  own: "rounded-20 rounded-br-6",
  incoming: "rounded-20 rounded-bl-6",
} as const;

/** The conversation composer: the 56px control grows with the message to about five 24px lines, then scrolls. */
export const chatComposer = {
  control: "h-auto min-h-14 py-4",
  input: "h-6 max-h-30 resize-none overflow-y-auto leading-6",
} as const;

/**
 * SelfieFrame preview surface: the Figma 300px, shrinking with short viewports (200–400 % zoom) to
 * no less than 160px so the capture row stays on screen.
 */
export const selfieFrameHeight = "min(18.75rem, max(10rem, calc(var(--svh) - 16rem)))";

/**
 * Swipe card photo (rule 60): the Figma 448:464 frame, capped by the viewport so the name, details
 * and Pass / Like / Super Like share the first screen at 1440×900, 1280×800 and 1366×768. From
 * 1024px everything below the photo (31rem) stays on screen; stacked layouts pin the decision row
 * (`layout.stickyActions`), so the cap there only keeps the name close (21.5rem incl. the tab bar).
 */
/**
 * LIKES card photo (rule 60): 4:5, capped by the viewport so the first row's Pass / Like show on the
 * first screen at 1280×800 and 1366×768 (27rem: the header, heading and the card's name and buttons).
 */
export const likePhotoFrame = "max-h-[max(12rem,calc(var(--svh)-27rem))]";

export const swipePhotoFrame = "max-h-[min(29rem,max(10rem,calc(var(--svh)-21.5rem)))] lg:max-h-[min(29rem,max(14rem,calc(var(--svh)-31rem)))]";

/**
 * MATCHES card photo (rule 60): 4:5, capped by the viewport (43rem: the header, heading, tabs and the
 * card's name, badge, preview and three actions), so a whole card fits the first screen at 1440×900,
 * where the cap gives about the Figma 240px. Never under 7rem (so 1280×800 also fits).
 */
export const matchPhotoFrame = "max-h-[max(7rem,calc(var(--svh)-43rem))]";

/**
 * VENUES map (rule 60): the Figma 672×492 frame as a ratio, capped by the viewport (32rem: header,
 * heading, recommendation, area line, map note and actions) so the whole composition fits 1440×900.
 * Beside it (≥1024) the place list scrolls inside the same height.
 */
export const venueMapFrame = "aspect-[672/492] max-h-[min(30.75rem,max(12rem,calc(var(--svh)-32rem)))]";
export const venueListFrame = "lg:max-h-[min(34.5rem,max(16rem,calc(var(--svh)-28.25rem)))] lg:overflow-y-auto";

export const sectionSpacing = {
  /** 128px at desktop */
  lg: "py-16 md:py-24 xl:py-32",
  /** 132px at desktop */
  xl: "py-16 md:py-24 xl:py-33",
  /** 80px at desktop (legal) */
  md: "py-12 md:py-16 xl:py-20",
} as const;

export type SectionSpacing = keyof typeof sectionSpacing;

/** Eyebrow → title and title → description gaps per Figma section. */
export const introSpacing = {
  steps: { title: "pt-5", description: "pt-6" },
  split: { title: "pt-5", description: "pt-6" },
  aside: { title: "pt-5", description: "pt-7" },
  window: { title: "pt-4.5", description: "pt-6" },
  stack: { title: "pt-6", description: "pt-6" },
  closing: { title: "pt-5", description: "pt-6.25" },
  faq: { title: "pt-5.5", description: "pt-6.25" },
} as const;

export type IntroSpacing = keyof typeof introSpacing;

export const layout = {
  container: "page-container",
  /** Long-form reading column (legal articles): 1088px wide, text capped near 75 characters per line. */
  readingColumn: "max-w-reading break-anywhere",
  readingMeasure: "max-w-measure",
  /**
   * A page's primary controls (chat composer, Like / Pass) pinned to the bottom of the viewport below
   * 1024px, above the phone tab bar (64px, 44px when short), so they show at 200–400 % zoom (rule 49).
   */
  /** LIKES grid: 256px cards, 1 column at 360px, 2 from ~560px, 4 in the 1440 frame (wider zooms scale as one piece, rule 59). */
  likesGrid: "grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-4",
  /** MATCHES cards: as many 240px-plus columns as fit, one at 360px (the Figma frame shows three in 856px). */
  matchesGrid: "grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-6",
  stickyActions: "max-lg:sticky max-lg:bottom-0 max-sm:bottom-16 max-sm:short:bottom-11 max-lg:z-10 max-lg:bg-white max-lg:py-3 max-lg:short:py-1.5",
} as const;

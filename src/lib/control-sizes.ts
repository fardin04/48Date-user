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
} as const;

export type ButtonSize = keyof typeof buttonSizes;

/** Fixed widths the Align UI buttons use in Figma. */
export const buttonWidths = {
  auto: "",
  login: "w-30",
  signup: "w-40",
  back: "w-52",
  full: "w-full",
  /** Onboarding action row: 112px Back, 240px primary (shrinks beside Back on phones). */
  setupBack: "w-28",
  setupPrimary: "w-60 min-w-0 max-sm:shrink max-sm:px-4",
  /** Portal decision row: 136 / 136 / 152 of the 448px deck, scaling together on narrow screens. */
  decision: "min-w-0 flex-[136_1_0]",
  superLike: "min-w-0 flex-[152_1_0]",
  /** Portal fixed widths from the W04 frames. */
  portalAction: "w-45",
  findMore: "w-54",
  notifyAction: "w-56",
  summaryAction: "w-60",
  profileAction: "w-75",
  /** W05 screen action slot: 200px, wider for long labels. */
  actionSlot: "min-w-50 max-sm:w-full",
  /** Chat composer "Send". */
  send: "w-20",
  passAction: "w-50",
  /** W09 PROFILE "Settings" beside the 160px "Edit profile". */
  settingsAction: "w-35",
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
} as const;

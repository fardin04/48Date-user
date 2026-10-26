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
} as const;

export type ButtonSize = keyof typeof buttonSizes;

/** Fixed widths the Align UI buttons use in Figma. */
export const buttonWidths = {
  auto: "",
  login: "w-30",
  signup: "w-40",
  back: "w-52",
  full: "w-full",
  /** Onboarding action row: 112px Back, 240px primary. */
  setupBack: "w-28",
  setupPrimary: "w-60",
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
} as const;

/** 56px form control (auth + onboarding "Form / Input control"): states from Figma. */
export const fieldControl = {
  base: `${typeScale.text14Relaxed} flex h-14 w-full items-center gap-3 rounded-12 border bg-white px-4 text-strong transition-colors focus-within:border-rose`,
  default: "border-input-line",
  error: "border-error",
  disabled: "border-input-line bg-gray-100 text-gray-400",
} as const;

export type FieldState = Exclude<keyof typeof fieldControl, "base">;

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

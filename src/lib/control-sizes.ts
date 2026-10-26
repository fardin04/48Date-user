import { typeScale } from "./type-scale";

/** Control and layout sizes from Figma (rule 8). */
export const buttonSizes = {
  /** Landing nav actions — 48px, 16/24 bold */
  md: `${typeScale.text16Bold} h-12 gap-4.5 px-6 rounded-12`,
  /** Landing CTAs — 54px, 16/24 bold */
  lg: `${typeScale.text16Bold} h-13.5 gap-4.5 px-6 rounded-12`,
  /** Align UI buttons on the solid nav and legal pages — 56px, 16/20 bold */
  xl: `${typeScale.button16} h-14 gap-1 px-7 rounded-12`,
} as const;

export type ButtonSize = keyof typeof buttonSizes;

/** Fixed widths the Align UI buttons use in Figma. */
export const buttonWidths = {
  auto: "",
  login: "w-30",
  signup: "w-40",
  back: "w-52",
} as const;

export type ButtonWidth = keyof typeof buttonWidths;

export const iconSizes = { 16: "size-4", 18: "size-4.5", 20: "size-5", 24: "size-6" } as const;

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

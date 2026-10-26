import type { Destination, ScreenCode } from "@/lib/routes";
import type { IconName, ImageAsset } from "../types";

/** Single-value answers kept in the profile draft (see lib/onboarding/profile-draft). */
export type DraftField =
  | "nickname"
  | "firstName"
  | "lastName"
  | "dob"
  | "occupation"
  | "identity"
  | "meet"
  | "smoking"
  | "alcohol"
  | "children"
  | "familyPlans"
  | "height"
  | "weight"
  | "education"
  | "religion"
  | "languages"
  | "goal"
  | "personality"
  | "communication";

/** Onboarding steps in flow order; each owns one URL (rule 32). */
export type OnboardingStep =
  | "location"
  | "nickname"
  | "privateName"
  | "birthday"
  | "identity"
  | "lifestyle"
  | "details"
  | "interests"
  | "goals"
  | "personality"
  | "communication"
  | "photos"
  | "verify"
  | "notify"
  | "ready";

export type StageKey = "about" | "lifestyle" | "connection" | "photos" | "final";

/** Heading of a setup screen or one of its states. */
export type SetupIntro = { title: string; description: string };

export type SelectOption = { value: string; label: string };

export type SetupField = {
  key: DraftField;
  label: string;
  type: "text" | "select";
  /** Text placeholder, or the empty option of a select. */
  placeholder: string;
  options?: SelectOption[];
  optional?: boolean;
  autoComplete?: string;
  /** Fields sharing a `row` sit side by side from 640px (Height + Weight). */
  row?: string;
};

export type Choice = { value: string; icon: IconName; title: string; description: string };

/** Where a step's Back and Continue lead: an onboarding step, or a Destination outside it. */
export type StepLink = OnboardingStep | Destination;

export type StepFlow = {
  screen: ScreenCode;
  number: number;
  back: StepLink;
  next: StepLink;
};

export type MapVisual = { image: ImageAsset; title: string; description: string };

export type Area = { id: string; name: string; label: string; region: string };

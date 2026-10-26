import type { Destination, ScreenCode } from "@/lib/routes";
import type { IconName, ImageAsset } from "../types";

/** Answers kept in the profile draft (see lib/onboarding/profile-draft). */
export type DraftKey =
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

export type StageKey = "about" | "lifestyle" | "connection" | "photos" | "final";

export type SetupIntro = { title: string; description: string };

export type SelectOption = { value: string; label: string };

export type SetupField = {
  key: DraftKey;
  label: string;
  type: "text" | "select";
  placeholder: string;
  options?: SelectOption[];
  optional?: boolean;
  autoComplete?: string;
  /** Fields sharing a `row` sit side by side (Height + Weight). */
  row?: string;
};

export type Choice = { value: string; icon: IconName; title: string; description: string };

export type StepNavigation = {
  /** Screen the Back button opens; a Destination when it lives outside onboarding or isn't built. */
  back: ScreenCode | Destination;
  /** Screen opened after a successful Continue. */
  next: ScreenCode | Destination;
};

export type MapVisual = { image: ImageAsset; title: string; description: string };

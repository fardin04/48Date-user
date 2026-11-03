import { to } from "@/lib/routes";
import type { Action, IconName } from "../types";
import type { StageKey } from "./types";

type Stage = { key: StageKey; title: string; description: string; icon: IconName; lastStep: number };

/** Copy shared by every W02 onboarding screen (guided sidebar, header, action row). */
export const onboardingShared = {
  totalSteps: 15,
  sidebar: {
    label: "CREATE YOUR PROFILE",
    navLabel: "Profile setup progress",
    stages: [
      { key: "about", title: "About you", description: "Your name, age and area", icon: "user-circle", lastStep: 4 },
      { key: "lifestyle", title: "Your lifestyle", description: "The details that make you, you", icon: "coffee-01", lastStep: 8 },
      { key: "connection", title: "Your connection", description: "Interests and honest intentions", icon: "favourite", lastStep: 11 },
      { key: "photos", title: "Photos & trust", description: "Show up as your real self", icon: "camera-01", lastStep: 13 },
      { key: "final", title: "Final touches", description: "Make room for a real connection", icon: "checkmark-circle-02", lastStep: 15 },
    ] satisfies Stage[],
    doneIcon: "checkmark-circle-02" as IconName,
    /** Announced after each stage title for assistive tech. */
    stateLabels: { done: "completed", current: "current", upcoming: "upcoming" },
    promise: { title: "Your pace. Your privacy.", description: "Your nickname is public. Your private details stay yours." },
  },
  back: { label: "Back to website", to: to("L02"), icon: "arrow-left-02" } satisfies Action,
  header: { label: "YOUR 48DATE PROFILE", step: "Step {step} of {total}" },
  backLabel: "Back",
  backIcon: "arrow-left-02" as IconName,
  continueLabel: "Continue",
  /** The input component's default error text in Figma. */
  fieldError: "Please check this value and try again.",
};

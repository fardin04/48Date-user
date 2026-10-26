import { notFunctional, to } from "@/lib/routes";
import type { Action } from "../types";
import type { StageKey } from "./types";

/** Copy shared by every W02 onboarding screen (guided sidebar, header, action row). */
export const onboardingShared = {
  totalSteps: 15,
  sidebar: {
    label: "CREATE YOUR PROFILE",
    navLabel: "Profile setup progress",
    stages: [
      { key: "about", title: "About you", description: "Your name, age and area", icon: "user-circle", lastStep: 4 },
      { key: "lifestyle", title: "Your lifestyle", description: "The details that make you, you", icon: "coffee-01", lastStep: 7 },
      { key: "connection", title: "Your connection", description: "Interests and honest intentions", icon: "favourite", lastStep: 11 },
      { key: "photos", title: "Photos & trust", description: "Show up as your real self", icon: "camera-01", lastStep: 13 },
      { key: "final", title: "Final touches", description: "Make room for a real connection", icon: "checkmark-circle-02", lastStep: 15 },
    ] satisfies { key: StageKey; title: string; description: string; icon: Action["icon"]; lastStep: number }[],
    stateLabels: { done: "completed", current: "current step", upcoming: "upcoming" },
    promise: { title: "Your pace. Your privacy.", description: "Your nickname is public. Your private details stay yours." },
  },
  doneIcon: "checkmark-circle-02",
  back: { label: "Back to website", to: to("L02"), icon: "arrow-left-02" } satisfies Action,
  header: { label: "YOUR 48DATE PROFILE", step: "Step {step} of {total}" },
  backLabel: "Back",
  continueLabel: "Continue",
  /** Cross-section destinations that are not built yet (rule 12). */
  pending: {
    verifyIntro: notFunctional("Identity verification (VERIFY-INTRO, step 13) is not built yet"),
    discover: notFunctional("Discover (user portal) is not built yet"),
  },
};

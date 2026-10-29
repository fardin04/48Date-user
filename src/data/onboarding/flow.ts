import { to } from "@/lib/routes";
import type { OnboardingStep, StepFlow } from "./types";

/** Step order, numbers and Back / Continue targets from the W02 handoff notes. */
export const onboardingFlow = {
  location: { screen: "LOCATION", number: 1, back: to("PHONE-VERIFIED"), next: "nickname" },
  nickname: { screen: "NICKNAME", number: 2, back: "location", next: "privateName" },
  privateName: { screen: "PRIVATE-NAME", number: 3, back: "nickname", next: "birthday" },
  birthday: { screen: "BIRTHDAY", number: 4, back: "privateName", next: "identity" },
  identity: { screen: "IDENTITY", number: 5, back: "birthday", next: "lifestyle" },
  lifestyle: { screen: "LIFESTYLE", number: 6, back: "identity", next: "details" },
  details: { screen: "DETAILS", number: 7, back: "lifestyle", next: "interests" },
  interests: { screen: "INTERESTS", number: 8, back: "details", next: "goals" },
  goals: { screen: "GOALS", number: 9, back: "interests", next: "personality" },
  personality: { screen: "PERSONALITY", number: 10, back: "goals", next: "communication" },
  communication: { screen: "COMMUNICATION", number: 11, back: "personality", next: "photos" },
  photos: { screen: "PHOTOS", number: 12, back: "communication", next: "verify" },
  verify: { screen: "VERIFY-INTRO", number: 13, back: "photos", next: "notify" },
  notify: { screen: "NOTIFY", number: 14, back: "verify", next: "ready" },
  ready: { screen: "READY", number: 15, back: "notify", next: to("DISCOVER") },
} satisfies Record<OnboardingStep, StepFlow>;

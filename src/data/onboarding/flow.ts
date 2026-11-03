import { to } from "@/lib/routes";
import type { OnboardingStep, StepFlow } from "./types";

/** Step order, numbers and Back / Continue targets from the W02 handoff notes. */
export const onboardingFlow = {
  location: { screen: "LOCATION", number: 1, back: to("PHONE-VERIFIED"), next: "nickname" },
  nickname: { screen: "NICKNAME", number: 2, back: "location", next: "privateName" },
  privateName: { screen: "PRIVATE-NAME", number: 3, back: "nickname", next: "birthday" },
  birthday: { screen: "BIRTHDAY", number: 4, back: "privateName", next: "lifestyle" },
  // From LIFESTYLE to GOALS the order follows the mobile app (the API's step order), not the W02 notes.
  lifestyle: { screen: "LIFESTYLE", number: 5, back: "birthday", next: "identity" },
  identity: { screen: "IDENTITY", number: 6, back: "lifestyle", next: "personality" },
  personality: { screen: "PERSONALITY", number: 7, back: "identity", next: "communication" },
  communication: { screen: "COMMUNICATION", number: 8, back: "personality", next: "interests" },
  interests: { screen: "INTERESTS", number: 9, back: "communication", next: "details" },
  details: { screen: "DETAILS", number: 10, back: "interests", next: "goals" },
  goals: { screen: "GOALS", number: 11, back: "details", next: "photos" },
  photos: { screen: "PHOTOS", number: 12, back: "goals", next: "verify" },
  verify: { screen: "VERIFY-INTRO", number: 13, back: "photos", next: "notify" },
  notify: { screen: "NOTIFY", number: 14, back: "verify", next: "ready" },
  // Finishing setup opens MATCHES, where the background auto-matching run's results arrive.
  ready: { screen: "READY", number: 15, back: "notify", next: to("MATCHES") },
} satisfies Record<OnboardingStep, StepFlow>;

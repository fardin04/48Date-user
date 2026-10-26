import type { IconName } from "../types";
import type { SetupIntro } from "./types";

export type TrustDetails = { icon: IconName; title: string; description: string; steps: string[] };

const trust: TrustDetails = {
  icon: "shield-01",
  title: "A real person behind every profile",
  description: "Your selfie is private. Your public photos stay the same.",
  steps: ["1 · Take selfie", "2 · Private review", "3 · Get badge"],
};

const backToVerification = "Back to verification";

/**
 * W03 / Identity Verification (step 13): VERIFY-INTRO, VERIFY-CAMERA, VERIFY-DENIED,
 * VERIFY-CAPTURE, VERIFY-REVIEW, VERIFY-PENDING, VERIFY-RETRY, VERIFY-DONE and VERIFY-STATUS.
 */
export const verifyStep = {
  intro: {
    intro: { title: "Verify your profile", description: "A quick selfie helps us check that your profile photos are really you." },
    trust,
    primary: "Start verification",
    secondary: "Skip for now",
  },
  camera: {
    intro: { title: "Camera access for verification", description: "Use your camera for a quick selfie. Your public photos won’t change." },
    trust,
    primary: "Allow camera & continue",
    starting: "Starting camera…",
    secondary: "Not now",
  },
  denied: {
    intro: { title: "Camera access is off", description: "Enable camera access to take a verification selfie, or come back later." },
    trust,
    primary: "Open browser settings",
    secondary: backToVerification,
  },
  capture: {
    intro: { title: "Center your face", description: "Look at the camera in good light. Keep your full face inside the frame." },
    videoLabel: "Camera preview",
    primary: "Take selfie",
    secondary: "Cancel",
  },
  review: {
    intro: { title: "Check your selfie", description: "Make sure your face is clear and well lit before submitting." },
    alt: "Your verification selfie",
    primary: "Submit selfie",
    submitting: "Submitting…",
    secondary: "Retake selfie",
  },
  pending: {
    intro: { title: "Selfie submitted", description: "We’re reviewing your verification. You can keep using your profile while you wait." },
    badge: "Pending review",
    trust: {
      icon: "shield-01",
      title: "Your selfie is in review",
      description: "You can continue setup while we check it.",
      steps: ["Selfie sent", "Review pending", "Badge pending"],
    } satisfies TrustDetails,
    primary: "Continue setup",
  },
  retry: {
    intro: { title: "Let’s try another selfie", description: "We couldn’t confirm your profile from this photo. Make sure your whole face is visible." },
    trust,
    primary: "Try again",
    secondary: backToVerification,
  },
  done: {
    intro: { title: "You’re verified", description: "Your verification badge is now visible on your profile." },
    trust: {
      icon: "checkmark-circle-02",
      title: "Photo check complete",
      description: "Phone verified · Selfie approved",
      steps: ["Selfie sent", "Review approved", "Badge active"],
    } satisfies TrustDetails,
    primary: "Continue setup",
  },
  status: {
    intro: { title: "Your verification", description: "Keep your profile trustworthy while your private details stay private." },
    label: "Verification status",
    phone: { label: "Phone number", value: "Verified" },
    selfie: {
      label: "Profile selfie",
      values: { none: "Not verified", pending: "In review", retry: "Not verified", verified: "Verified" },
    },
    primary: "Verify my profile",
  },
} satisfies Record<string, { intro: SetupIntro } & Record<string, unknown>>;

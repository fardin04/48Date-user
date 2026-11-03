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
    intro: { title: "Verify your profile", description: "A quick selfie with a V sign helps us check that your profile photos are really you." },
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
    intro: { title: "Show your face and a V sign", description: "Look at the camera in good light and hold up two fingers ✌. The selfie is taken automatically." },
    videoLabel: "Camera preview",
    /** Shown while the automatic capture is waiting (design-silent, for owner approval). */
    auto: "Capturing automatically",
    /** Live guidance from the on-device face and hand check; nothing leaves the device until you submit. */
    guide: {
      loading: "Getting the camera check ready…",
      face: "Center your face inside the frame.",
      gesture: "Now hold up a V sign ✌ next to your face.",
      hold: "Hold still…",
    },
    /** When the on-device check can't run (old browser, no WebAssembly): capture by hand. */
    manual: "Automatic capture isn’t available here. Show a V sign and take the selfie yourself.",
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
    /**
     * The backend's `rejectReason` codes (design-silent copy, for owner approval). A reviewer's written
     * note is shown as `note`; an unknown code shows `fallback`.
     */
    reasons: {
      LOW_SIMILARITY: "Your selfie didn’t match your profile photos closely enough. Use a clear, front-facing selfie that looks like your main photo.",
      FACE_MISMATCH: "Your selfie didn’t match your profile photos closely enough. Use a clear, front-facing selfie that looks like your main photo.",
      NO_FACE: "We couldn’t see a face in your selfie. Keep your whole face inside the frame.",
      NO_FACE_DETECTED: "We couldn’t see a face in your selfie. Keep your whole face inside the frame.",
      MULTIPLE_FACES: "More than one face was in the photo. Take the selfie on your own.",
      GESTURE_NOT_DETECTED: "We couldn’t see the V sign. Hold up two fingers next to your face.",
      NO_GESTURE: "We couldn’t see the V sign. Hold up two fingers next to your face.",
      LOW_LIVENESS: "We couldn’t confirm this was a live photo. Take a new selfie with the camera, not a photo of a photo.",
      LIVENESS_FAILED: "We couldn’t confirm this was a live photo. Take a new selfie with the camera, not a photo of a photo.",
      LOW_QUALITY: "The photo was too dark or blurry. Find better light and hold still.",
      POOR_QUALITY: "The photo was too dark or blurry. Find better light and hold still.",
    } as Record<string, string>,
    note: "Reviewer’s note: {reason}",
    fallback: "Your selfie wasn’t approved. Take a new one with your face clearly visible and a V sign.",
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
      values: { none: "Not verified", pending: "In review", retry: "Not approved", verified: "Verified" },
    },
    primary: "Verify my profile",
  },
} satisfies Record<string, { intro: SetupIntro } & Record<string, unknown>>;

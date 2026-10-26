import type { NicknameCheck, OnboardingService, VerificationStatus } from "./onboarding-service";
import { getAreas } from "@/stores/onboarding-store";

/**
 * MOCK — stands in for the real profile API so every Figma state can be reviewed.
 * Not for production: replace `onboardingService` in ./onboarding-service.ts.
 *
 * - "GoldenHour" (any casing) is taken; every other valid nickname is available.
 * - Area search matches word prefixes in a starter list ("San Francisco, CA"); anything else finds nothing.
 * - Uploads progress over ~2.5s and fail while the browser is offline.
 * - A submitted selfie stays in review for ~6s, then is approved, or sent back for a retry
 *   when the photo is too dark to see a face. Nothing leaves the browser.
 */
const LATENCY_MS = 900;
const UPLOAD_TICK_MS = 120;
const UPLOAD_STEP = 5;

const taken: Record<string, Extract<NicknameCheck, { available: false }>> = {
  goldenhour: { available: false, suggestions: ["GoldenHour_28", "CityGolden", "CityLights"], recommended: "CityLights" },
};

/** Lower-case words of a query or label ("San Francisco, CA" → san, francisco, ca). */
const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const REVIEW_MS = 6000;
/** Average luma (0–255) under which the mock asks for another selfie. */
const MIN_BRIGHTNESS = 50;
const REVIEW_KEY = "48date.mock.verification";

type Review = { submittedAt: number; outcome: Extract<VerificationStatus, "retry" | "verified"> };

async function brightness(image: Blob) {
  const bitmap = await createImageBitmap(image);
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return 255;
  context.drawImage(bitmap, 0, 0, 32, 32);
  bitmap.close();
  const { data } = context.getImageData(0, 0, 32, 32);
  let total = 0;
  for (let index = 0; index < data.length; index += 4) total += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
  return total / (data.length / 4);
}

function readReview(): Review | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(REVIEW_KEY) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const { submittedAt, outcome } = value as Record<string, unknown>;
    return typeof submittedAt === "number" && (outcome === "retry" || outcome === "verified") ? { submittedAt, outcome } : null;
  } catch {
    return null;
  }
}

const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockOnboardingService: OnboardingService = {
  async checkNickname(nickname) {
    await wait();
    return taken[nickname.toLowerCase()] ?? { available: true };
  },
  async searchAreas(query) {
    const terms = words(query);
    if (terms.length === 0) return [];
    return getAreas().filter((area) => {
      const haystack = words(`${area.label} ${area.region}`);
      return terms.every((term) => haystack.some((word) => word.startsWith(term)));
    });
  },
  async uploadPhoto(_file, onProgress, signal) {
    for (let percent = 0; percent <= 100; percent += UPLOAD_STEP) {
      if (signal.aborted) return "failed";
      if (!navigator.onLine) return "failed";
      onProgress(percent);
      await wait(UPLOAD_TICK_MS);
    }
    return "uploaded";
  },
  async submitSelfie(selfie) {
    const outcome = (await brightness(selfie)) < MIN_BRIGHTNESS ? "retry" : "verified";
    await wait();
    try {
      sessionStorage.setItem(REVIEW_KEY, JSON.stringify({ submittedAt: Date.now(), outcome } satisfies Review));
    } catch {
      // Blocked storage: the review simply never completes in this mock.
    }
    return "pending";
  },
  async getVerification() {
    const review = readReview();
    if (!review) return "none";
    return Date.now() - review.submittedAt < REVIEW_MS ? "pending" : review.outcome;
  },
};

import { pause } from "@/lib/format";
import { searchAreaList } from "@/lib/onboarding/area-search";
import type { NicknameCheck, OnboardingService, VerificationStatus } from "@/lib/onboarding/onboarding-service";

/**
 * MOCK — stands in for the real profile API so every Figma state can be reviewed.
 * Not for production: replace `onboardingService` in ./onboarding-service.ts.
 *
 * - "GoldenHour" (any casing) is taken; every other valid nickname is available.
 * - Area search matches word prefixes in a starter list ("San Francisco, CA"); anything else finds nothing.
 * - Uploads progress over ~2.5s and fail while the browser is offline.
 * - A submitted selfie stays in review for ~6s, then is approved, or sent back for a retry
 *   when the photo is too dark to see a face. Nothing leaves the browser.
 * - A saved nickname is locked for this tab, as the API reports it (D-117).
 */
const LATENCY_MS = 900;
const UPLOAD_TICK_MS = 120;
const UPLOAD_STEP = 5;

const taken: Record<string, Extract<NicknameCheck, { available: false }>> = {
  goldenhour: { available: false, suggestions: ["GoldenHour_28", "CityGolden", "CityLights"], recommended: "CityLights" },
};

/** How often a review in progress is checked (the mock decides after ~6s). */
const CHECK_MS = 1000;
const REVIEW_MS = 6000;
/** Average luma (0–255) under which the mock asks for another selfie. */
/** The reason code the mock sends a dark selfie back with (shown like the API's `rejectReason`). */
const TOO_DARK = "LOW_QUALITY";
const MIN_BRIGHTNESS = 50;
const REVIEW_KEY = "48date.mock.verification";
const NICKNAME_KEY = "48date.mock.nickname";

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
  async getNicknameSuggestions() {
    return null;
  },
  async searchAreas(query) {
    return searchAreaList(query);
  },
  async getOptions() {
    return null;
  },
  async getProgress() {
    let lockedNickname: string | null = null;
    try {
      lockedNickname = sessionStorage.getItem(NICKNAME_KEY);
    } catch {
      // Blocked storage: nothing saved.
    }
    return lockedNickname ? { completed: false, draft: {}, lockedNickname } : null;
  },
  // Answers stay in the session draft; nothing is sent anywhere. A saved nickname is kept, so
  // returning to NICKNAME shows it locked like the API does.
  async saveStep(step, { draft }) {
    const nickname = draft.fields.nickname?.trim();
    if (step === "nickname" && nickname) {
      try {
        sessionStorage.setItem(NICKNAME_KEY, nickname);
      } catch {
        // Blocked storage: the lock lasts only while the query cache holds it.
      }
    }
    return { ok: true };
  },
  async uploadPhoto(_file, onProgress, signal) {
    for (let percent = 0; percent <= 100; percent += UPLOAD_STEP) {
      if (signal.aborted || !navigator.onLine) return { status: "failed" };
      onProgress(percent);
      await wait(UPLOAD_TICK_MS);
    }
    return { status: "uploaded" };
  },
  async submitSelfie(selfie) {
    const outcome = (await brightness(selfie)) < MIN_BRIGHTNESS ? "retry" : "verified";
    await wait();
    try {
      sessionStorage.setItem(REVIEW_KEY, JSON.stringify({ submittedAt: Date.now(), outcome } satisfies Review));
    } catch {
      // Blocked storage: the review simply never completes in this mock.
    }
    return { status: "pending" };
  },
  async getVerification() {
    const review = readReview();
    if (!review) return { status: "none" };
    if (Date.now() - review.submittedAt < REVIEW_MS) return { status: "pending" };
    return review.outcome === "retry" ? { status: "retry", reason: TOO_DARK } : { status: review.outcome };
  },
  // The mock's sample matches are already there.
  startMatching() {},
  async waitForVerification(signal) {
    for (;;) {
      const current = await mockOnboardingService.getVerification();
      if (current.status !== "pending") return current;
      await pause(CHECK_MS, signal);
    }
  },
};

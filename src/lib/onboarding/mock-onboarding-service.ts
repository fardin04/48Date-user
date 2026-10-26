import type { NicknameCheck, OnboardingService } from "./onboarding-service";
import { getAreas } from "@/stores/onboarding-store";

/**
 * MOCK — stands in for the real profile API so every Figma state can be reviewed.
 * Not for production: replace `onboardingService` in ./onboarding-service.ts.
 *
 * - "GoldenHour" (any casing) is taken; every other valid nickname is available.
 * - Area search matches word prefixes in a starter list ("San Francisco, CA"); anything else finds nothing.
 * - Uploads progress over ~2.5s and fail while the browser is offline.
 */
const LATENCY_MS = 900;
const UPLOAD_TICK_MS = 120;
const UPLOAD_STEP = 5;

const taken: Record<string, Extract<NicknameCheck, { available: false }>> = {
  goldenhour: { available: false, suggestions: ["GoldenHour_28", "CityGolden", "CityLights"], recommended: "CityLights" },
};

/** Lower-case words of a query or label ("San Francisco, CA" → san, francisco, ca). */
const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

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
};

import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { useLoaded } from "./use-loaded";

/**
 * Option lists for the select and interest steps (`GET /onboarding/options`), or null to keep the
 * starter lists. The API module caches the response for an hour, so every step reads it once.
 */
export function useOnboardingOptions() {
  return useLoaded(onboardingService.getOptions).value ?? null;
}

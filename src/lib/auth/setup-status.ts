import type { OnboardingStatus } from "@/lib/api/types/auth";
import { MEMBER_PREFIX } from "@/lib/auth/member-data";

/** Where a signed-in member belongs: the guided setup until the API reports it COMPLETED, then the portal. */
export type SetupState = "onboarding" | "portal";

const KEY = `${MEMBER_PREFIX}setup`;

/**
 * The member's onboarding status as the API last reported it (sign-in, each saved step, the
 * onboarding state), so portal pages open at once for members who finished and new members are
 * sent to setup. Kept in localStorage for every tab; cleared on sign-out and at each new sign-in.
 */
export const setupStatus = {
  read(): SetupState | null {
    try {
      const value = localStorage.getItem(KEY);
      return value === "onboarding" || value === "portal" ? value : null;
    } catch {
      return null;
    }
  },
  fromApi(status: OnboardingStatus) {
    try {
      localStorage.setItem(KEY, status === "COMPLETED" ? "portal" : "onboarding");
    } catch {
      // Blocked storage: the portal guard asks the API instead.
    }
  },
};

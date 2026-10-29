import { getPortalShell } from "@/stores/portal-store";
import { useProfileDraft } from "@/lib/onboarding/profile-draft";

/** The member's approximate area from onboarding, or the sample area until one is known. */
export function useMemberLocation() {
  return useProfileDraft().area?.label ?? getPortalShell().defaultLocation;
}

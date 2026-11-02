import { getPortalShell } from "@/stores/portal-store";
import { useProfileDraft } from "@/lib/onboarding/profile-draft";
import { accountService } from "@/lib/portal/account-service";
import { liveData } from "@/lib/portal/live";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "./use-loaded";

/**
 * The member's approximate area: their profile's city (live), else the area chosen in onboarding,
 * else the sample area (mocks only). Shares the overview read with the profile screens.
 */
export function useMemberLocation() {
  const draftArea = useProfileDraft().area?.label;
  const area = useLoaded(screenKeys.overview, accountService.getOverview, { enabled: liveData }).value?.area;
  return area ?? draftArea ?? (liveData ? "" : getPortalShell().defaultLocation);
}

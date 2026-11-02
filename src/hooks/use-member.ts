import type { MemberId } from "@/data/portal/types";
import { portalService } from "@/lib/portal/portal-service";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "./use-loaded";

/**
 * A member's public profile (`GET /discovery/profile/:nickname` with the API), shared by every
 * screen showing them: undefined while loading, null when unavailable. Pass null to wait for an id.
 */
export function useMember(member: MemberId | null | undefined) {
  return useLoaded(screenKeys.member(member ?? ""), () => portalService.getMember(member ?? ""), { enabled: Boolean(member) }).value;
}

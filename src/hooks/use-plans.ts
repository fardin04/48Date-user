import type { Plan, PlanId } from "@/data/portal/membership";
import { liveData } from "@/lib/portal/live";
import { membershipService } from "@/lib/portal/membership-service";
import { screenKeys } from "@/lib/screen-keys";
import { getPlan, getPlans } from "@/stores/portal-store";
import { useLoaded } from "./use-loaded";

/**
 * Premium billing periods with their current prices (`GET /subscriptions/plans`, cached for ten
 * minutes). The mocks show the drafted sample prices; live, nothing shows until the real ones load.
 */
export function usePlans(): Plan[] {
  return useLoaded(screenKeys.plans, membershipService.getPlans).value ?? (liveData ? [] : getPlans());
}

/** One billing period's pricing; null while live prices load. */
export function usePlan(id: PlanId): Plan | null {
  return usePlans().find((plan) => plan.id === id) ?? (liveData ? null : getPlan(id));
}

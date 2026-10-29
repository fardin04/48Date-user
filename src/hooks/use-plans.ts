import type { Plan, PlanId } from "@/data/portal/membership";
import { membershipService } from "@/lib/portal/membership-service";
import { getPlan, getPlans } from "@/stores/portal-store";
import { useLoaded } from "./use-loaded";

/**
 * Premium billing periods with their current prices (`GET /subscriptions/plans`, cached for ten
 * minutes); the drafted sample prices show until they load.
 */
export function usePlans(): Plan[] {
  return useLoaded(membershipService.getPlans).value ?? getPlans();
}

/** One billing period's pricing. */
export function usePlan(id: PlanId): Plan {
  return usePlans().find((plan) => plan.id === id) ?? getPlan(id);
}

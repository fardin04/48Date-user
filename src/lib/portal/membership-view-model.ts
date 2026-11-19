import type { Plan, PlanId } from "@/data/portal/membership";
import type { BillingInterval } from "@/lib/api/types/subscriptions";

/**
 * Phase 33: Membership & Pricing Plans view-model logic.
 */

export const intervalOf: Record<PlanId, BillingInterval> = {
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

/** Formats currency amounts as "$X.YY". */
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Resolves plan headline and billing copy from API price values. */
export function formatPlanPricing(
  planId: PlanId,
  priceUsd: number
): { price: string; headline: string; billing?: string } {
  const amount = formatUsd(priceUsd);
  if (planId === "yearly") {
    const monthlyEquivalent = formatUsd(priceUsd / 12);
    return {
      price: amount,
      headline: `${monthlyEquivalent}/mo`,
      billing: `${amount} billed yearly`,
    };
  }
  return {
    price: amount,
    headline: amount,
  };
}

/** Resolves active or renewal-off status text for the status badge. */
export function resolveRenewalStatus(renews: boolean, activeLabel: string, renewalOffLabel: string): string {
  return renews ? activeLabel : renewalOffLabel;
}

/** Formats free tier conversation usage string. */
export function formatConversationUsage(used: number, included: number): string {
  return `${used} of ${included} used`;
}

/** Finds a plan by ID with safe fallback. */
export function resolvePlan(plans: Plan[], id: PlanId | null | undefined): Plan {
  return plans.find((p) => p.id === id) ?? plans[0];
}

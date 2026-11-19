/**
 * Phase 34: Checkout flow pure logic.
 * Enforces terms agreement gating, state transitions, and confirmed entitlement rules.
 */

export type CheckoutPhase = "review" | "provider" | "process" | "done" | "error";

/** Terms must be agreed to before navigating to provider. */
export function canProceedToProvider(agreed: boolean): boolean {
  return agreed;
}

/** Determines next phase after payment result from provider. */
export function nextCheckoutPhase(result: "paid" | "failed"): "done" | "error" {
  return result === "paid" ? "done" : "error";
}

/**
 * Entitlement confirmation rule: entitlements only change from confirmed provider results.
 */
export function isEntitlementActive(status: "paid" | "failed" | "pending"): boolean {
  return status === "paid";
}

/** Calculates total price summary copy for provider screen. */
export function formatProviderSummary(planName: string, price: string, period: string): string {
  return `${planName}: ${price} USD / ${period}`;
}

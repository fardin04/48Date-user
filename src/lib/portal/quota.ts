import type { PlanId } from "@/data/portal/membership";

/**
 * Phase 34: Conversation Quota pure logic.
 * Free plan grants a limited number of weekly conversation unlocks; Premium is unlimited.
 */

export type QuotaCheckInput = {
  plan: PlanId | null;
  conversationsUsed: number;
  includedConversations: number;
};

export type QuotaResult = "allowed" | "limit";

/** Evaluates whether starting a new conversation is allowed under the current membership quota. */
export function evaluateConversationQuota(membership: QuotaCheckInput): QuotaResult {
  if (membership.plan !== null) {
    return "allowed";
  }
  return membership.conversationsUsed < membership.includedConversations ? "allowed" : "limit";
}

/** Calculates remaining conversation unlocks for free plan display. */
export function calculateRemainingConversations(membership: QuotaCheckInput): number {
  if (membership.plan !== null) {
    return Infinity;
  }
  return Math.max(0, membership.includedConversations - membership.conversationsUsed);
}

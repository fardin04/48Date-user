import type { Plan, PlanId } from "@/data/portal/membership";
import type { MemberId } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { apiMembershipService } from "@/lib/portal/api-membership-service";
import { mockMembershipService } from "@/lib/portal/mocks/mock-membership-service";

/** The member's entitlement, as the billing provider last confirmed it. */
export type Membership = {
  /** null on the free plan. */
  plan: PlanId | null;
  /** False once renewal is stopped; access continues until `periodEnds`. */
  renews: boolean;
  /** ISO day the paid period ends (renews or lapses). */
  periodEnds: string | null;
  /** Free plan: new conversations used this period, out of `includedConversations`. */
  conversationsUsed: number;
  includedConversations: number;
  /** The conversation the free allowance went to, when known ("Return to chat"). */
  lastConversation: MemberId | null;
};

/**
 * Contract the W10 membership screens talk to. Entitlements and renewals come only from verified
 * provider events; checkout happens on the provider's hosted page, so no card data ever reaches
 * this app.
 */
export type MembershipService = {
  /** Premium billing periods with their current prices. */
  getPlans: () => Promise<Plan[]>;
  getMembership: () => Promise<Membership>;
  /** Starts checkout and waits for the provider's result: `paid` (PAY-DONE) or `failed` (PAY-ERROR). */
  checkout: (plan: PlanId) => Promise<"paid" | "failed">;
  /** Looks for an active purchase on this account; null when none is found (PAY-RESTORE-NONE). */
  restore: () => Promise<Membership | null>;
  /** Stops future renewals; rejects when the provider can't be reached. */
  stopRenewal: () => Promise<void>;
  /** Free plan: may this member start a new conversation? */
  startConversation: (member: MemberId) => Promise<"allowed" | "limit">;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const membershipService: MembershipService = apiEnabled ? apiMembershipService : mockMembershipService;

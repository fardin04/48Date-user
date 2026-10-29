import { planIds, type Plan, type PlanId } from "@/data/portal/membership";
import { invalidate } from "@/lib/api/cache";
import { isApiError } from "@/lib/api/errors";
import { cacheKeys } from "@/lib/api/modules/cache-keys";
import { subscriptionsApi } from "@/lib/api/modules/subscriptions-api";
import type { BillingInterval, MySubscriptionData } from "@/lib/api/types/subscriptions";
import type { Membership, MembershipService } from "@/lib/portal/membership-service";
import { getMembershipPage, getPlans } from "@/stores/portal-store";

const PREMIUM = "PREMIUM";
/** The free plan's weekly conversation allowance (Postman `03 Get My Entitlements`). */
const CHAT_UNLOCKS = "CHAT_UNLOCKS_PER_WEEK";

const intervalOf: Record<PlanId, BillingInterval> = { weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY" };
const planOf = (interval: BillingInterval): PlanId => planIds.find((id) => intervalOf[id] === interval) ?? "monthly";
const usd = (amount: number) => `$${amount.toFixed(2)}`;

function toMembership(subscription: MySubscriptionData, used: number, included: number): Membership {
  const active = subscription.isPremium ? subscription.subscription : null;
  return {
    plan: active ? planOf(active.billingInterval) : null,
    renews: active?.autoRenew ?? false,
    periodEnds: active ? active.currentPeriodEnd.slice(0, 10) : null,
    conversationsUsed: used,
    includedConversations: included,
    lastConversation: null,
  };
}

async function membership(): Promise<Membership> {
  const [{ data: subscription }, entitlements] = await Promise.all([subscriptionsApi.me(), subscriptionsApi.entitlements().catch(() => null)]);
  const chats = entitlements?.data[CHAT_UNLOCKS];
  return toMembership(subscription, chats?.currentUsage ?? 0, chats?.numericValue ?? getMembershipPage().freeConversations);
}

/** User / 13 - Subscriptions: plans, status, the dummy checkout and cancellation. */
export const apiMembershipService: MembershipService = {
  async getPlans() {
    const fallback = getPlans();
    try {
      const premium = (await subscriptionsApi.plans()).data.find((plan) => plan.key === PREMIUM);
      if (!premium) return fallback;
      return fallback.flatMap((plan): Plan[] => {
        const price = premium.prices.find((item) => item.isActive && item.billingInterval === intervalOf[plan.id]);
        if (!price) return [];
        const amount = usd(price.priceUsd);
        // Yearly leads with its monthly equivalent, as drawn ("$8.33/mo", "$99.99 billed yearly").
        return [plan.id === "yearly" ? { ...plan, price: amount, headline: `${usd(price.priceUsd / 12)}/mo`, billing: `${amount} billed yearly` } : { ...plan, price: amount, headline: amount }];
      });
    } catch {
      return fallback;
    }
  },
  getMembership: membership,
  async checkout(plan) {
    try {
      await subscriptionsApi.start({ planKey: PREMIUM, billingInterval: intervalOf[plan] });
      return "paid";
    } catch (error) {
      // Already subscribed: the membership is active, which is what the member asked for.
      return isApiError(error) && error.code === "ALREADY_SUBSCRIBED" ? "paid" : "failed";
    }
  },
  async restore() {
    invalidate(cacheKeys.subscription, cacheKeys.entitlements);
    const current = await membership();
    return current.plan ? current : null;
  },
  async stopRenewal() {
    await subscriptionsApi.cancel();
  },
  async startConversation() {
    const current = await membership();
    // The chat itself counts the unlock server-side; this only answers whether one is left.
    return current.plan || current.conversationsUsed < current.includedConversations ? "allowed" : "limit";
  },
};

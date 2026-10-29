/** User / 13 - Subscriptions. */

export type BillingInterval = "WEEKLY" | "MONTHLY" | "YEARLY";

export type PlanPrice = {
  id: string;
  billingInterval: BillingInterval;
  amountMinor: number;
  priceUsd: number;
  currency: string;
  compareAtAmountMinor: number | null;
  discountPercent: number | null;
  isActive: boolean;
};

export type SubscriptionPlan = {
  id: string;
  key: "FREE" | "PREMIUM" | string;
  name: string;
  description: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  prices: PlanPrice[];
};

export type Subscription = {
  id: string;
  planKey: string;
  planName: string;
  priceId: string;
  billingInterval: BillingInterval;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | string;
  startedAt: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  autoRenew: boolean;
  source: string;
};

export type MySubscriptionData = { isPremium: boolean; planKey: string; planName: string; subscription: Subscription | null };

export type Entitlement = {
  key: string;
  type: "LIMIT" | "BOOLEAN";
  boolValue: boolean | null;
  numericValue: number | null;
  currentUsage?: number;
  remaining?: number;
  isAllowed: boolean;
};
export type EntitlementsData = Record<string, Entitlement>;

export type StartSubscriptionBody = { planKey: string; billingInterval: BillingInterval };

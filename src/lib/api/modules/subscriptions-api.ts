import { invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { EntitlementsData, MySubscriptionData, StartSubscriptionBody, Subscription, SubscriptionPlan } from "../types/subscriptions";
import { cacheKeys } from "./cache-keys";

/** User / 13 - Subscriptions. */
export const subscriptionsApi = {
  /** Public catalogue; kept for ten minutes. */
  plans: () => api.get<SubscriptionPlan[]>(endpoints.subscriptions.plans, { auth: false, share: { key: cacheKeys.plans, ttlMs: 10 * 60_000 } }),
  me: () => api.get<MySubscriptionData>(endpoints.subscriptions.me, { share: { key: cacheKeys.subscription, ttlMs: 30_000 } }),
  entitlements: () => api.get<EntitlementsData>(endpoints.subscriptions.entitlements, { share: { key: cacheKeys.entitlements, ttlMs: 30_000 } }),
  async start(body: StartSubscriptionBody) {
    const result = await api.post<Subscription>(endpoints.subscriptions.start, { body });
    invalidate(cacheKeys.subscription, cacheKeys.entitlements);
    return result;
  },
  async cancel() {
    const result = await api.post<Subscription>(endpoints.subscriptions.cancel);
    invalidate(cacheKeys.subscription);
    return result;
  },
};

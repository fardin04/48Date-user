import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { EntitlementsData, MySubscriptionData, StartSubscriptionBody, Subscription, SubscriptionPlan } from "../types/subscriptions";
import { cacheKeys } from "./cache-keys";

/** User / 13 - Subscriptions. */
export const subscriptionsApi = {
  /** Public catalogue; kept for ten minutes. */
  plans: () => cached(cacheKeys.plans, 10 * 60_000, () => api.get<SubscriptionPlan[]>(endpoints.subscriptions.plans, { auth: false })),
  me: () => cached(cacheKeys.subscription, 30_000, () => api.get<MySubscriptionData>(endpoints.subscriptions.me)),
  entitlements: () => cached(cacheKeys.entitlements, 30_000, () => api.get<EntitlementsData>(endpoints.subscriptions.entitlements)),
  async start(body: StartSubscriptionBody) {
    const result = await api.post<Subscription>(endpoints.subscriptions.start, { body });
    invalidate(cacheKeys.subscription, cacheKeys.entitlements);
    return result;
  },
  async cancel() {
    const result = await api.post<Subscription>(endpoints.subscriptions.cancel);
    invalidate(cacheKeys.subscription, cacheKeys.entitlements);
    return result;
  },
};

/** Keys of shared GETs (see ../cache.ts); writes invalidate the ones they change. */
export const cacheKeys = {
  onboardingState: "onboarding:state",
  options: "onboarding:options",
  me: "users:me",
  trustScore: "users:trust-score",
  trustHistory: "trust:history",
  notificationSettings: "users:notification-settings",
  plans: "subscriptions:plans",
  subscription: "subscriptions:me",
  entitlements: "subscriptions:entitlements",
} as const;

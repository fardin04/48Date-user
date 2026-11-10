/**
 * TanStack Query keys (../cache.ts). API modules cache raw responses under these; screens nest
 * their own keys below them (`[...cacheKeys.me, "overview"]`), so a write that invalidates a key
 * refreshes every screen built from it.
 */
export const cacheKeys = {
  onboardingState: ["onboarding", "state"],
  options: ["onboarding", "options"],
  verification: ["verification"],
  me: ["users", "me"],
  trustScore: ["users", "trust-score"],
  reportReasons: ["trust", "report-reasons"],
  blocks: ["trust", "blocks"],
  warnings: ["users", "warnings"],
  notificationSettings: ["users", "notification-settings"],
  authMethods: ["auth", "methods"],
  plans: ["subscriptions", "plans"],
  subscription: ["subscriptions", "me"],
  entitlements: ["subscriptions", "entitlements"],
  preferences: ["discovery", "preferences"],
  discoveryRun: ["discovery", "run"],
  discoveryProfile: ["discovery", "profile"],
  matches: ["matches"],
  conversations: ["conversations"],
  games: ["games"],
  dates: ["dates"],
  venues: ["venues"],
  aiQuota: ["ai", "quota"],
  notifications: ["notifications"],
  stories: ["stories"],
  myStories: ["stories", "mine"],
} as const;

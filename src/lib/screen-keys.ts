import { cacheKeys } from "@/lib/api/modules/cache-keys";

/**
 * TanStack Query keys of the values screens read through `useLoaded`. Each nests under the API
 * cache key it is built from, so the write that invalidates that key refreshes every screen showing
 * it (rule 41). Components take keys from here, never write their own.
 */
export const screenKeys = {
  nicknameSuggestions: ["onboarding", "nickname-suggestions"],
  onboardingOptions: [...cacheKeys.options, "screen"],
  verification: [...cacheKeys.verification, "status"],
  onboardingProgress: [...cacheKeys.onboardingState, "progress"],
  areas: (query: string) => ["onboarding", "areas", query.trim().toLowerCase()],
  preferences: [...cacheKeys.preferences, "screen"],
  deck: [...cacheKeys.discoveryRun, "deck"],
  member: (member: string) => [...cacheKeys.discoveryProfile, member],
  matches: [...cacheKeys.matches, "list"],
  match: (member: string) => [...cacheKeys.matches, "member", member],
  // Under the raw list key: a new message refreshes the inbox without re-reading an open chat.
  conversations: [...cacheKeys.conversations, "raw", "screen"],
  conversation: (member: string) => [...cacheKeys.conversations, "member", member],
  datePlan: (member: string) => [...cacheKeys.dates, "plan", member],
  venues: (member: string) => [...cacheKeys.venues, member],
  plans: [...cacheKeys.plans, "screen"],
  membership: [...cacheKeys.subscription, "membership"],
  overview: [...cacheKeys.me, "overview"],
  avatar: [...cacheKeys.me, "avatar"],
  profile: [...cacheKeys.me, "profile"],
  photos: [...cacheKeys.me, "photos"],
  account: [...cacheKeys.me, "account"],
  signInMethods: [...cacheKeys.authMethods, "screen"],
  trust: [...cacheKeys.trustScore, "screen"],
  trustHistory: [...cacheKeys.trustHistory, "screen"],
  notificationPrefs: [...cacheKeys.notificationSettings, "screen"],
  blocked: [...cacheKeys.blocks, "screen"],
  reportReasons: [...cacheKeys.reportReasons, "screen"],
  warnings: [...cacheKeys.warnings, "screen"],
  notifications: [...cacheKeys.notifications, "inbox"],
  unreadCount: [...cacheKeys.notifications, "unread"],
  stories: [...cacheKeys.stories, "feed"],
  story: (id: string) => [...cacheKeys.stories, "detail", id],
  storySubmission: [...cacheKeys.myStories, "submission"],
  storyMeetOptions: [...cacheKeys.myStories, "meet-options"],
} as const;

/**
 * Every API path the web client calls, relative to `apiBaseUrl` (Postman: `48Date-Backend`, User folder).
 * Components and services never write a path literal; dynamic segments are encoded here.
 */
const at = (value: string) => encodeURIComponent(value);

export const endpoints = {
  auth: {
    requestOtp: "/auth/phone/request-otp",
    verifyOtp: "/auth/phone/verify",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  onboarding: {
    state: "/onboarding",
    options: "/onboarding/options",
    nicknameSuggestions: "/onboarding/nickname-suggestions",
    nicknameAvailability: "/onboarding/nickname-availability",
    step: (step: string) => `/onboarding/steps/${at(step)}`,
  },
  files: "/files",
  verification: {
    start: "/verification",
    snapshot: (id: string) => `/verification/${at(id)}`,
  },
  users: {
    me: "/users/me",
    profile: "/users/me/profile",
    photos: "/users/me/photos",
    location: "/users/me/location",
    trustScore: "/users/me/trust-score",
    notificationSettings: "/users/me/notification-settings",
  },
  trust: {
    history: "/trust-score/history",
  },
  subscriptions: {
    plans: "/subscriptions/plans",
    me: "/subscriptions/me",
    entitlements: "/subscriptions/me/entitlements",
    start: "/subscriptions/start",
    cancel: "/subscriptions/cancel",
  },
} as const;

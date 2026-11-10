/**
 * Every API path the web client calls, relative to `apiBaseUrl` (Postman: `48Date-Backend`, User folder).
 * Components and services never write a path literal; dynamic segments are encoded here.
 * The Admin folder belongs to the admin console and is not called from this app.
 */
const at = (value: string) => encodeURIComponent(value);

function deepFreeze<T extends object>(value: T): T {
  for (const child of Object.values(value)) if (typeof child === "object" && child !== null) deepFreeze(child);
  return Object.freeze(value);
}

/** Deep-frozen (below): paths can't be rewritten at runtime. */
export const endpoints = deepFreeze({
  health: "/health",
  auth: {
    requestOtp: "/auth/phone/request-otp",
    verifyOtp: "/auth/phone/verify",
    google: "/auth/google",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    methods: "/auth/methods",
    /** POST links, DELETE unlinks (same path). */
    linkGoogle: "/auth/link/google",
    linkPhoneRequestOtp: "/auth/link/phone/request-otp",
    linkPhoneVerify: "/auth/link/phone/verify",
    /** DELETE unlinks the phone. */
    linkPhone: "/auth/link/phone",
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
    events: (id: string) => `/verification/${at(id)}/events`,
  },
  users: {
    me: "/users/me",
    profile: "/users/me/profile",
    photos: "/users/me/photos",
    location: "/users/me/location",
    trustScore: "/users/me/trust-score",
    notificationSettings: "/users/me/notification-settings",
    pushToken: "/users/me/push-token",
    pendingWarnings: "/users/me/warnings/pending",
    acknowledgeWarning: (id: string) => `/users/me/warnings/${at(id)}/acknowledge`,
    stories: "/users/me/success-stories",
    storyEligibleDates: "/users/me/story-eligible-dates",
  },
  matching: {
    runs: "/matching/runs",
    run: (id: string) => `/matching/runs/${at(id)}`,
    events: (id: string) => `/matching/runs/${at(id)}/events`,
  },
  matches: {
    list: "/matches",
    unseen: "/matches/unseen",
    detail: (matchId: string) => `/matches/${at(matchId)}`,
    seen: (matchId: string) => `/matches/${at(matchId)}/seen`,
    venueSuggestions: (matchId: string) => `/matches/${at(matchId)}/venue-suggestions`,
    dates: (matchId: string) => `/matches/${at(matchId)}/dates`,
  },
  discovery: {
    preferences: "/discovery/preferences",
    runs: "/discovery/runs",
    currentRun: "/discovery/runs/current",
    run: (id: string) => `/discovery/runs/${at(id)}`,
    events: (id: string) => `/discovery/runs/${at(id)}/events`,
    cards: (id: string) => `/discovery/runs/${at(id)}/cards`,
    profile: (nickname: string) => `/discovery/profile/${at(nickname)}`,
    swipes: "/discovery/swipes",
  },
  conversations: {
    list: "/conversations",
    detail: (id: string) => `/conversations/${at(id)}`,
    messages: (id: string) => `/conversations/${at(id)}/messages`,
    seen: (id: string) => `/conversations/${at(id)}/seen`,
    games: (id: string) => `/conversations/${at(id)}/games`,
    replySuggestions: (id: string) => `/conversations/${at(id)}/reply-suggestions`,
    openerSuggestion: (id: string) => `/conversations/${at(id)}/opener-suggestion`,
  },
  games: {
    types: "/games/types",
    detail: (id: string) => `/games/${at(id)}`,
    answers: (id: string) => `/games/${at(id)}/answers`,
  },
  venues: {
    run: (id: string) => `/venue-suggestions/${at(id)}`,
    events: (id: string) => `/venue-suggestions/${at(id)}/events`,
    weather: (id: string) => `/venue-suggestions/${at(id)}/weather`,
  },
  dates: {
    list: "/dates",
    detail: (id: string) => `/dates/${at(id)}`,
    accept: (id: string) => `/dates/${at(id)}/accept`,
    decline: (id: string) => `/dates/${at(id)}/decline`,
    withdraw: (id: string) => `/dates/${at(id)}/withdraw`,
    postpone: (id: string) => `/dates/${at(id)}/postpone-requests`,
    postponeAction: (id: string, requestId: string, action: "accept" | "decline" | "withdraw") =>
      `/dates/${at(id)}/postpone-requests/${at(requestId)}/${action}`,
    cancel: (id: string) => `/dates/${at(id)}/cancel`,
    confirm: (id: string) => `/dates/${at(id)}/confirm`,
    rating: (id: string) => `/dates/${at(id)}/rating`,
    history: (id: string) => `/dates/${at(id)}/history`,
  },
  ai: {
    quota: "/ai/suggestions/quota",
    request: (id: string) => `/reply-suggestions/${at(id)}`,
    regenerate: (id: string) => `/reply-suggestions/${at(id)}/regenerate`,
    events: (id: string) => `/reply-suggestions/${at(id)}/events`,
  },
  trust: {
    reportReasons: "/reports/reasons",
    reports: "/reports",
    blocks: "/blocks",
    block: (nickname: string) => `/blocks/${at(nickname)}`,
  },
  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    read: (id: string) => `/notifications/${at(id)}/read`,
    readAll: "/notifications/read-all",
    detail: (id: string) => `/notifications/${at(id)}`,
  },
  subscriptions: {
    plans: "/subscriptions/plans",
    me: "/subscriptions/me",
    entitlements: "/subscriptions/me/entitlements",
    start: "/subscriptions/start",
    cancel: "/subscriptions/cancel",
  },
  stories: {
    feed: "/success-stories",
    detail: (id: string) => `/success-stories/${at(id)}`,
    respond: (id: string) => `/success-stories/${at(id)}/respond`,
    like: (id: string) => `/success-stories/${at(id)}/like`,
    comments: (id: string) => `/success-stories/${at(id)}/comments`,
    comment: (id: string, commentId: string) => `/success-stories/${at(id)}/comments/${at(commentId)}`,
  },
} as const);

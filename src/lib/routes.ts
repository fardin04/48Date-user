/**
 * Screen codes from Figma → URL paths (rule 11). Routing is path-based:
 * a section is a path segment (`/how-it-works`, `/terms/community-conduct`), never a `#hash`.
 *
 * - The Terms frame is labelled "L02" like the landing page; it is keyed `L02-TC`.
 * - Date planning is `/dates/<step>/<member>` (toItem("VENUES", id)); DATE-PENDING's URL also shows the
 *   plan's later states (confirmed, declined, cancelled, expired, attendance).
 * - INBOX and CHAT-01 share `/chats`: a conversation is `/chats/<member>` (toItem("CHAT-01", id)).
 * - Portal member pages take the member id as their section: DISCOVER-PROFILE → /discover/profile/wildflower,
 *   COMPAT → /discover/compatibility/goldenhour, MATCH-EXPIRING → /matches/match/goldenhour.
 * - W09 profile and settings: REPORT-DETAIL is `/report` (from Privacy), `/report/<member>` or
 *   `/report/<story>`; PROFILE-UNVERIFIED, PROFILE-SAVED, PREFS-SAVED, NOTIFY-DENIED, TRUST-REVIEW,
 *   BLOCKED-EMPTY, DELETE-DONE and REPORT-DONE are states of the screen that leads to them.
 * - W10 membership: checkout is `/membership/checkout/<plan>` (toItem("PAY-REVIEW", "weekly")), with
 *   PAY-PROVIDER, PAY-PROCESS, PAY-DONE and PAY-ERROR as its states; MEMBERSHIP shows MEMBERSHIP-FREE
 *   on the free plan; PAY-RESTORE-NONE and PAY-CANCELLED are states of their screens.
 * - Auth codes are the screen that opens each URL; other Figma states of the same step
 *   (PHONE-ERROR, OTP-FILLED, OTP-ERROR, OTP-RESEND, OTP-EXPIRED, OTP-LIMIT, VERIFY-PROCESS…)
 *   are interaction states rendered on that URL.
 */
export const screens = {
  L02: "/",
  "L02-TC": "/terms",
  L03: "/privacy",
  WELCOME: "/signup",
  OTP: "/signup/verify",
  "PHONE-VERIFIED": "/signup/verified",
  "GOOGLE-REDIRECT": "/signup/google",
  "GOOGLE-ERROR": "/signup/google/error",
  SIGNIN: "/signin",
  "OTP-SIGNIN": "/signin/verify",
  "SIGNIN-VERIFIED": "/signin/verified",
  "SIGNIN-GOOGLE": "/signin/google",
  "SIGNIN-GOOGLE-ERROR": "/signin/google/error",
  SESSION: "/signin/session-ended",
  LOCATION: "/onboarding/location",
  NICKNAME: "/onboarding/nickname",
  "PRIVATE-NAME": "/onboarding/private-name",
  BIRTHDAY: "/onboarding/birthday",
  IDENTITY: "/onboarding/identity",
  LIFESTYLE: "/onboarding/lifestyle",
  DETAILS: "/onboarding/details",
  INTERESTS: "/onboarding/interests",
  GOALS: "/onboarding/goals",
  PERSONALITY: "/onboarding/personality",
  COMMUNICATION: "/onboarding/communication",
  PHOTOS: "/onboarding/photos",
  "VERIFY-INTRO": "/onboarding/verify",
  NOTIFY: "/onboarding/notifications",
  READY: "/onboarding/ready",
  DISCOVER: "/discover",
  FILTERS: "/discover/filters",
  "DISCOVER-PROFILE": "/discover/profile",
  COMPAT: "/discover/compatibility",
  MATCHES: "/matches",
  "MATCHES-CANCELLED": "/matches/cancelled",
  "MATCHES-COMPLETE": "/matches/complete",
  "MATCH-EXPIRING": "/matches/match",
  INBOX: "/chats",
  "CHAT-01": "/chats",
  VENUES: "/dates/venues",
  "VENUE-DETAIL": "/dates/place",
  "DATE-TIME": "/dates/time",
  "DATE-REVIEW": "/dates/review",
  "DATE-PENDING": "/dates/plan",
  "DATE-MANAGE": "/dates/manage",
  FEEDBACK: "/dates/feedback",
  GAMES: "/games",
  STORIES: "/stories",
  "STORY-DETAIL": "/stories/story",
  "STORY-CREATE": "/stories/new",
  "STORY-MINE": "/stories/mine",
  "DATE-COMPLETE": "/dates/complete",
  PROFILE: "/profile",
  "PROFILE-EDIT": "/profile/edit",
  "PHOTO-MANAGE": "/profile/photos",
  TRUST: "/profile/trust",
  "TRUST-HISTORY": "/profile/trust/activity",
  "TRUST-HELP": "/profile/trust/review",
  SETTINGS: "/settings",
  ACCOUNT: "/settings/account",
  "SETTINGS-LOCATION": "/settings/location",
  "NOTIFY-PREFS": "/settings/notifications",
  PRIVACY: "/settings/privacy",
  BLOCKED: "/settings/blocked",
  "DELETE-ACCOUNT": "/settings/delete",
  NOTIFICATIONS: "/notifications",
  "REPORT-DETAIL": "/report",
  MEMBERSHIP: "/membership",
  PLANS: "/membership/plans",
  "PAY-REVIEW": "/membership/checkout",
  "PAY-RESTORE": "/membership/restore",
  "PAY-CANCEL": "/membership/manage",
  QUOTA: "/membership/limit",
} as const;

export type ScreenCode = keyof typeof screens;

/**
 * `section` scrolls to a part of the page (the scroll position is kept); `param` names the item a
 * page shows (a member id) and opens it at the top. Both become the last path segment.
 */
export type Destination =
  | { screen: ScreenCode; section?: string; param?: string }
  | { notFunctional: string };

export function hrefFor(screen: ScreenCode, section?: string) {
  const path = screens[screen];
  if (!section) return path;
  return path === "/" ? `/${section}` : `${path}/${section}`;
}

/** Marks an action whose destination is not available yet (rule 12). */
export function notFunctional(reason: string): Destination {
  return { notFunctional: reason };
}

export function to(screen: ScreenCode, section?: string): Destination {
  return { screen, section };
}

/** A page for one item (`DISCOVER-PROFILE` + "wildflower" → /discover/profile/wildflower). */
export function toItem(screen: ScreenCode, param: string): Destination {
  return { screen, param };
}

/** Optional catch-all `section` param → the section id it targets (or undefined for the page top). */
/** Prerendered as a static 404 by the landing route; `proxy.ts` rewrites unknown top-level paths here. */
export const notFoundSegment = "not-found";

export function sectionFromParam(param: string[] | undefined, allowed: readonly string[]) {
  if (!param || param.length === 0) return { valid: true, section: undefined };
  const [section, ...rest] = param;
  return { valid: rest.length === 0 && allowed.includes(section), section };
}

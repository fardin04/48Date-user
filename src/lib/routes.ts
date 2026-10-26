/**
 * Screen codes from Figma → URL paths (rule 11). Routing is path-based:
 * a section is a path segment (`/how-it-works`, `/terms/community-conduct`), never a `#hash`.
 *
 * - The Terms frame is labelled "L02" like the landing page; it is keyed `L02-TC`.
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
  NOTIFY: "/onboarding/notifications",
  READY: "/onboarding/ready",
} as const;

export type ScreenCode = keyof typeof screens;

export type Destination =
  | { screen: ScreenCode; section?: string }
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

/** Optional catch-all `section` param → the section id it targets (or undefined for the page top). */
export function sectionFromParam(param: string[] | undefined, allowed: readonly string[]) {
  if (!param || param.length === 0) return { valid: true, section: undefined };
  const [section, ...rest] = param;
  return { valid: rest.length === 0 && allowed.includes(section), section };
}

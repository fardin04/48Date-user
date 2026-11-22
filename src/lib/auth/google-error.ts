/**
 * The API's own reason for a refused Google sign-in (e.g. GOOGLE_EMAIL_UNVERIFIED, GOOGLE_NOT_CONFIGURED),
 * carried from GOOGLE-REDIRECT to GOOGLE-ERROR for this tab only. Cleared when a new attempt starts and on sign-out.
 */
const KEY = "48date.auth.google-error";

export const googleError = {
  write(message: string | null) {
    try {
      if (message) sessionStorage.setItem(KEY, message);
      else sessionStorage.removeItem(KEY);
    } catch {
      // Blocked storage: GOOGLE-ERROR shows its usual copy only.
    }
  },
  /** A stable snapshot for useSyncExternalStore. */
  snapshot(): string | null {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  /** Written before navigating, so the error screen never needs a change notification. */
  subscribe: () => () => undefined,
};

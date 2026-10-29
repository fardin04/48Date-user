/**
 * Where the session's tokens live (the only place in the app that touches them):
 * - the short-lived access token stays in memory only, never in storage;
 * - the rotating refresh token is kept in this tab's sessionStorage so a reload keeps the session.
 *   It is gone when the tab closes, is never logged, and is cleared on sign-out. The API returns it
 *   in the response body (Postman `02 Verify Phone OTP`); an httpOnly cookie set by the API would
 *   be safer and is the recommended backend change.
 */
const REFRESH_KEY = "48date.auth.refresh";

let accessToken: string | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function readRefresh(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export const tokenStore = {
  access: () => accessToken,
  refresh: readRefresh,
  hasSession: () => accessToken !== null || readRefresh() !== null,
  set(tokens: { accessToken: string; refreshToken: string }) {
    accessToken = tokens.accessToken;
    try {
      sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } catch {
      // Blocked storage: the session lasts until this page is reloaded.
    }
  },
  /**
   * Forget both tokens. `notify` (default) tells route guards, which send the member to sign in;
   * a deliberate sign-out passes false because its screen navigates on its own.
   */
  clear(notifyGuards = true) {
    accessToken = null;
    try {
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      // Nothing stored.
    }
    if (notifyGuards) notify();
  },
  /** Sign-in and sign-out notify route guards. */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

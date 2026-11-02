/**
 * Where the session's tokens live (the only place in the app that touches them):
 * - the short-lived access token (15 minutes) stays in memory only, never in storage;
 * - the rotating refresh token is kept in localStorage, shared by every tab of this browser.
 *
 * The API rotates the refresh token on every refresh and revokes the whole session when an old one
 * is sent again (`REFRESH_TOKEN_REUSED`). A per-tab copy (sessionStorage) let a duplicated tab, or a
 * second copy of the code after a hot reload, send an old token and sign the member out. One shared
 * copy, refreshed under a browser-wide lock (`withRefreshLock`), always sends the newest token.
 * It is never logged and is cleared on sign-out in every tab. An httpOnly cookie set by the API
 * would be safer still and is the recommended backend change.
 */
const REFRESH_KEY = "48date.auth.refresh";
const LOCK = "48date.auth.refresh-lock";

let accessToken: string | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function readRefresh(): string | null {
  try {
    const shared = localStorage.getItem(REFRESH_KEY);
    if (shared) return shared;
    // A session saved by the earlier per-tab storage moves to the shared one once.
    const legacy = sessionStorage.getItem(REFRESH_KEY);
    if (legacy) {
      localStorage.setItem(REFRESH_KEY, legacy);
      sessionStorage.removeItem(REFRESH_KEY);
    }
    return legacy;
  } catch {
    return null;
  }
}

// Signed out (or in) in another tab: tell this tab's route guards.
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("storage", (event) => {
    if (event.key !== REFRESH_KEY && event.key !== null) return;
    if (!event.newValue) accessToken = null;
    notify();
  });
}

/**
 * Runs a refresh while holding a lock shared by every tab (and every copy of this code in a tab),
 * so two refreshes never send the same refresh token. Without the Web Locks API it just runs.
 */
export function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  // `request` resolves with the callback's own result (its typing nests the promise).
  return locks ? (locks.request(LOCK, run) as unknown as Promise<T>) : run();
}

export const tokenStore = {
  access: () => accessToken,
  refresh: readRefresh,
  hasSession: () => accessToken !== null || readRefresh() !== null,
  set(tokens: { accessToken: string; refreshToken: string }) {
    accessToken = tokens.accessToken;
    try {
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
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
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      // Nothing stored.
    }
    if (notifyGuards) notify();
  },
  /** Sign-in and sign-out (in any tab) notify route guards. */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

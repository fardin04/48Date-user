/**
 * Base URL of the 48Date API (`NEXT_PUBLIC_API_BASE_URL`, e.g. `http://localhost:4000/api/v1`; see
 * `.env.example`). While it is empty every service keeps its marked mock, so the app runs without a
 * backend; once set, the integrated services talk to the API.
 */
export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export const apiEnabled = apiBaseUrl.length > 0;

/**
 * Where stored photo keys (`users/…/photo-1.webp`) are served from when the API returns a key
 * instead of a signed URL (`NEXT_PUBLIC_MEDIA_BASE_URL`); absolute URLs are used as they are.
 */
export const mediaBaseUrl = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/** Socket.IO gateway (`socketUrl` in the Postman environment): the API origin unless set. */
export const socketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL ?? "").replace(/\/+$/, "") || (apiEnabled ? new URL(apiBaseUrl).origin : "");

/** Google OAuth web client ID for "Continue with Google" (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`); public by design. */
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/** Sent as `device` on sign-in so the session list names this client. */
export const apiDevice = { platform: "web", appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0" } as const;

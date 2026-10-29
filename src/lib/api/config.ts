/**
 * Base URL of the 48Date API (`NEXT_PUBLIC_API_BASE_URL`, e.g. `http://localhost:4000/api/v1`; see
 * `.env.example`). While it is empty every service keeps its marked mock, so the app runs without a
 * backend; once set, the integrated services talk to the API.
 */
export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export const apiEnabled = apiBaseUrl.length > 0;

/** Sent as `device` on sign-in so the session list names this client. */
export const apiDevice = { platform: "web", appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0" } as const;

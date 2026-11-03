import { apiEnabled, googleClientId } from "@/lib/api/config";

/**
 * How "Continue with Google" works (configuration only, safe on the server): `live` signs in with
 * Google Identity Services, `unavailable` when the API is on but no client ID is set (the button is
 * not functional), `prototype` on the mocks.
 */
export type GoogleMode = "live" | "unavailable" | "prototype";

export const googleMode: GoogleMode = !apiEnabled ? "prototype" : googleClientId ? "live" : "unavailable";

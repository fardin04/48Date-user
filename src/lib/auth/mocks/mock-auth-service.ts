import type { AuthService, PhoneNumber } from "@/lib/auth/auth-service";
import { clearMemberData } from "@/lib/auth/member-data";

/**
 * MOCK — stands in for the real authentication API so every Figma state can be reviewed.
 * Not for production: replace `authService` in ./auth-service.ts.
 *
 * - Any six-digit code verifies, except 000000 (mismatch) and 999999 (expired).
 * - The fourth resend in a session hits the request limit.
 * - A verified code marks this tab as signed in (sessionStorage). A real API should keep its token
 *   in an httpOnly cookie, never in script-readable storage.
 */
const LATENCY_MS = 900;
const MAX_RESENDS = 3;
const MISMATCH_CODE = "000000";
const EXPIRED_CODE = "999999";
const resendKey = (phone: PhoneNumber) => `48date.mock.resends.${phone.dial}${phone.national}`;

const SESSION_KEY = "48date.session";

const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

export const mockAuthService: AuthService = {
  async sendCode() {
    await wait();
    return "sent";
  },
  async resendCode(phone) {
    await wait();
    const count = Number(sessionStorage.getItem(resendKey(phone)) ?? 0) + 1;
    sessionStorage.setItem(resendKey(phone), String(count));
    return count > MAX_RESENDS ? "limited" : "sent";
  },
  async verifyCode(_phone, code) {
    await wait();
    if (code === MISMATCH_CODE) return "mismatch";
    if (code === EXPIRED_CODE) return "expired";
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt: Date.now() }));
    } catch {
      // Blocked storage: the member stays signed out.
    }
    return "verified";
  },
  hasSession() {
    try {
      const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
      return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).startedAt === "number";
    } catch {
      return false;
    }
  },
  // The mock session only changes through this tab's own sign-in / sign-out.
  onSessionChange: () => () => {},
  async signOut() {
    clearMemberData();
  },
};

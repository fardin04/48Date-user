import type { AuthService, PhoneNumber } from "./auth-service";

/**
 * MOCK — stands in for the real authentication API so every Figma state can be reviewed.
 * Not for production: replace `authService` in ./auth-service.ts.
 *
 * - Any six-digit code verifies, except 000000 (mismatch) and 999999 (expired).
 * - The fourth resend in a session hits the request limit.
 */
const LATENCY_MS = 900;
const MAX_RESENDS = 3;
const MISMATCH_CODE = "000000";
const EXPIRED_CODE = "999999";
const resendKey = (phone: PhoneNumber) => `48date.mock.resends.${phone.dial}${phone.national}`;

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
    return "verified";
  },
};

import { isApiError } from "@/lib/api/errors";
import { authApi } from "@/lib/api/modules/auth-api";
import { tokenStore } from "@/lib/api/tokens";
import { authErrors, type SessionData } from "@/lib/api/types/auth";
import type { AuthService, PhoneNumber, SendCodeResult, VerifyCodeResult } from "@/lib/auth/auth-service";
import { clearMemberData, clearMemberLocal } from "@/lib/auth/member-data";
import { setupStatus } from "@/lib/auth/setup-status";
import { rememberDevOtp } from "@/components/sections/auth/dev-otp-hint"; // TESTING ONLY

/** E.164: "+880" + "1811000001" (Postman `01 Request Phone OTP`). */
const e164 = (phone: PhoneNumber) => `${phone.dial}${phone.national}`.replace(/[^\d+]/g, "");

const limitCodes: string[] = [authErrors.cooldown, authErrors.hourlyLimit, authErrors.dailyLimit, authErrors.ipLimit];

/** When the last refused request may be repeated (B7: every OTP 429 carries `error.details.retryAfterSeconds`). */
let retryAt: number | null = null;

async function requestCode(phone: PhoneNumber): Promise<SendCodeResult> {
  try {
    const { data } = await authApi.requestOtp(e164(phone));
    rememberDevOtp(data.devOtp); // TESTING ONLY — see dev-otp-hint.tsx
    retryAt = null;
    return "sent";
  } catch (error) {
    const limited = isApiError(error) && (error.status === 429 || limitCodes.includes(error.code));
    const seconds = limited ? error.retryAfterSeconds : null;
    retryAt = seconds === null ? null : Date.now() + seconds * 1000;
    return limited ? "limited" : "failed";
  }
}

/** A new session: forget an earlier member's local facts, keep the tokens and where this member belongs. */
function startSession(data: SessionData) {
  clearMemberLocal();
  tokenStore.set(data);
  setupStatus.fromApi(data.onboardingStatus);
}

/** User / 01 - Auth: phone OTP sign-in; tokens are kept by `tokenStore`, refresh by the API client. */
export const apiAuthService: AuthService = {
  sendCode: requestCode,
  resendCode: requestCode,
  codeRetryAt: () => retryAt,
  async verifyCode(phone, code): Promise<VerifyCodeResult> {
    try {
      const { data } = await authApi.verifyOtp(e164(phone), code);
      startSession(data);
      return "verified";
    } catch (error) {
      if (!isApiError(error)) return "failed";
      if (error.code === authErrors.invalid) return "mismatch";
      if (error.code === authErrors.expired || error.code === authErrors.tooManyAttempts) return "expired";
      if (error.code === authErrors.banned) return "banned";
      return "failed";
    }
  },
  async signInWithGoogle(idToken) {
    try {
      const { data } = await authApi.google(idToken);
      startSession(data);
      return { status: "verified", next: data.onboardingStatus === "COMPLETED" ? "portal" : "onboarding" };
    } catch (error) {
      return { status: isApiError(error) && error.code === authErrors.banned ? "banned" : "failed" };
    }
  },
  setupState: setupStatus.read,
  hasSession: tokenStore.hasSession,
  onSessionChange: tokenStore.subscribe,
  async signOut() {
    if (tokenStore.hasSession()) {
      try {
        await authApi.logout();
      } catch {
        // Offline or already expired: the local session is cleared regardless.
      }
    }
    tokenStore.clear(false);
    clearMemberData();
  },
};

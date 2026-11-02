/** User / 01 - Auth. */

export type OnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type DevicePayload = { platform: "android" | "ios" | "web"; appVersion?: string; deviceName?: string };

export type RequestOtpBody = { phone: string };
export type RequestOtpData = { cooldownSeconds: number; attemptsLeft: number; expiresInSeconds: number; devOtp?: string };

export type VerifyOtpBody = { phone: string; otp: string; device?: DevicePayload };
export type SessionData = {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  onboardingStatus: OnboardingStatus;
  restored?: boolean;
};

export type RefreshBody = { refreshToken: string };
export type TokenPair = { accessToken: string; refreshToken: string };

/** Error codes the auth screens branch on. */
export const authErrors = {
  cooldown: "OTP_COOLDOWN",
  hourlyLimit: "OTP_HOURLY_LIMIT",
  dailyLimit: "OTP_DAILY_LIMIT",
  ipLimit: "OTP_IP_LIMIT",
  expired: "OTP_EXPIRED_OR_INVALID",
  invalid: "OTP_INVALID",
  tooManyAttempts: "OTP_TOO_MANY_ATTEMPTS",
  banned: "ACCOUNT_BANNED",
} as const;

/** `GET /auth/methods`: the masked phone and the linked Google email. */
export type SignInMethods = { phone: string | null; phoneVerified: boolean; google: { email: string } | null };

/** Error codes of Google sign-in and linking. */
export const linkErrors = {
  googleInvalid: "GOOGLE_TOKEN_INVALID",
  googleTaken: "GOOGLE_ACCOUNT_ALREADY_LINKED",
  phoneTaken: "PHONE_ALREADY_LINKED",
  lastMethod: "LAST_LOGIN_METHOD",
} as const;

import { mockAuthService } from "./mock-auth-service";

export type PhoneNumber = { dial: string; national: string };

export type SendCodeResult = "sent" | "limited";
export type VerifyCodeResult = "verified" | "mismatch" | "expired";

/**
 * Contract the authentication screens talk to. Expiry, resend cooldown and request limits
 * come from the service (handoff: "Expiry and limits come from the service").
 */
export type AuthService = {
  sendCode: (phone: PhoneNumber) => Promise<SendCodeResult>;
  resendCode: (phone: PhoneNumber) => Promise<SendCodeResult>;
  verifyCode: (phone: PhoneNumber, code: string) => Promise<VerifyCodeResult>;
};

/** Swap this for the real implementation when the authentication API is available. */
export const authService: AuthService = mockAuthService;

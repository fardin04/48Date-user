import { apiEnabled } from "@/lib/api/config";
import { apiAuthService } from "@/lib/auth/api-auth-service";
import { mockAuthService } from "@/lib/auth/mocks/mock-auth-service";

export type PhoneNumber = { dial: string; national: string };

/** `failed`: the code couldn't be sent (offline, invalid number); the screen shows `message`. */
export type SendCodeResult = "sent" | "limited" | "failed";
/** `banned` and `failed` come from the API (ACCOUNT_BANNED, offline). */
export type VerifyCodeResult = "verified" | "mismatch" | "expired" | "banned" | "failed";

/**
 * Contract the authentication screens talk to. Expiry, resend cooldown and request limits
 * come from the service (handoff: "Expiry and limits come from the service").
 */
export type AuthService = {
  sendCode: (phone: PhoneNumber) => Promise<SendCodeResult>;
  resendCode: (phone: PhoneNumber) => Promise<SendCodeResult>;
  /** A verified code starts the member's session. */
  verifyCode: (phone: PhoneNumber, code: string) => Promise<VerifyCodeResult>;
  /** Whether a member is signed in (route guards); false while prerendering. */
  hasSession: () => boolean;
  /** Notifies route guards when the session starts or ends (e.g. a refresh is rejected). */
  onSessionChange: (listener: () => void) => () => void;
  /** Ends the session and clears everything this tab stored for the member. */
  signOut: () => Promise<void>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const authService: AuthService = apiEnabled ? apiAuthService : mockAuthService;

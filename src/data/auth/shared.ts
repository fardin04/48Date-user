import { to } from "@/lib/routes";
import { images } from "../landing/images";
import type { Action, ImageAsset } from "../types";

/** Copy and assets shared by every W01 authentication screen. */
export const authShared = {
  photoPanel: {
    /** Same approved photograph as the landing page (byte-identical export). */
    image: { ...images.sunsetCouple, alt: "" } satisfies ImageAsset,
    title: "A little time.\nA real connection.",
    description: "Find your kind of person. Turn a good conversation into a plan worth keeping.",
    highlights: "Nickname-first profiles  ·  Real plans within 48 hours",
  },
  back: { label: "Back to website", to: to("L02"), icon: "arrow-left-02" } satisfies Action,
  footer: "© 2026 48Date. A little time, a real possibility.",
  phoneField: {
    label: "Phone number",
    countryLabel: "Country code",
    placeholder: "Enter your phone number",
    hint: "Your number stays off your public profile.",
    invalid: "Enter a valid mobile number for the selected country.",
    /** Design-silent: the API refused a new code (cooldown / hourly / daily limit). */
    limited: "Code requests are temporarily paused. Please wait a moment and try again.",
    /** Design-silent: the code couldn't be sent (offline, server error). */
    failed: "We couldn’t send a code right now. Check your connection and try again.",
  },
  continuePhone: "Continue with phone",
  continueGoogle: "Continue with Google",
  /** Shown while no Google client ID is configured (rule 12). */
  googleUnavailable: "Google sign-in isn’t set up for this site yet.",
  googleMark: { src: "/brand/google.svg", alt: "", width: 24, height: 24 } satisfies ImageAsset,
  or: "or",
  consent: {
    before: "By continuing, you confirm you’re 18 or older and agree to our ",
    terms: { label: "Terms of Service", to: to("L02-TC") } satisfies Action,
    between: " and ",
    privacy: { label: "Privacy Policy", to: to("L03") } satisfies Action,
    after: ".",
  },
  code: {
    label: "Six-digit code",
    /** Replaces `{phone}` in verify descriptions until the masked number is known. */
    phoneFallback: "your phone number",
    verify: "Verify & continue",
    editToContinue: "Edit code to continue",
    sendNew: "Send a new code",
    resend: "Resend code",
    changeNumber: "Change number",
    mismatch: "That code didn’t match. Check the digits or request a new code.",
    resent: "A new code is on its way. Use the most recent message.",
    expired: "This code is no longer valid. Your phone number is still saved.",
    limited: "Code requests are temporarily paused. Your number is saved.",
    /** Design-silent: ACCOUNT_BANNED and connection failures on verify. */
    banned: "This account has been banned.",
    failed: "We couldn’t check your code right now. Check your connection and try again.",
    processingLabel: "Checking your code",
  },
  successMark: { src: "/brand/success-mark.svg", alt: "", width: 96, height: 96 } satisfies ImageAsset,
  waitingLabel: "Waiting for Google",
};

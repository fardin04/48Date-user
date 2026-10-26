import type { Country } from "@/data/auth/countries";
import type { PhoneNumber } from "./auth-service";

export type PhoneDraft = { iso: string; national: string };

const STORAGE_KEY = "48date.auth.phone";
const MASK = "••••••";
const VISIBLE_DIGITS = 4;

export const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function isValidNational(country: Country, national: string) {
  return new RegExp(country.pattern).test(digitsOnly(national));
}

export const toPhoneNumber = (country: Country, national: string): PhoneNumber => ({
  dial: country.dial,
  national: digitsOnly(national),
});

/** "+880 •••••• 6155" — the number shown on verify screens. */
export const maskPhone = (phone: PhoneNumber) =>
  // Non-breaking spaces keep the masked number on one line.
  [phone.dial, MASK, phone.national.slice(-VISIBLE_DIGITS)].join(" ");

/**
 * The entered number lives in sessionStorage between steps (never in the URL), so
 * "Change number" and validation errors preserve it (handoff: State & edge cases).
 */
export type StoredPhone = PhoneDraft & PhoneNumber;

export const phoneSession = {
  /** Raw stored value — a stable snapshot for useSyncExternalStore. */
  snapshot(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  parse(raw: string | null): StoredPhone | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredPhone;
    } catch {
      return null;
    }
  },
  read(): StoredPhone | null {
    return phoneSession.parse(phoneSession.snapshot());
  },
  /** sessionStorage only changes from this tab's own writes, so there is nothing to subscribe to. */
  subscribe: () => () => {},
  write(country: Country, national: string) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ iso: country.iso, ...toPhoneNumber(country, national) }));
    } catch {
      // Private mode / blocked storage: the flow still works within the page.
    }
  },
};

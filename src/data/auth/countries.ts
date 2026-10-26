import type { ImageAsset } from "../types";

export type Country = {
  iso: string;
  name: string;
  dial: string;
  /** Twemoji flag exported from Figma; countries without an export fall back to `emoji`. */
  flag?: ImageAsset;
  emoji: string;
  /** National mobile number pattern (digits only, without the country code). */
  pattern: string;
};

/**
 * Country codes offered by the phone field. Figma shows Bangladesh (+880) as the default;
 * the rest are a starter list — the approved list belongs to the auth service.
 */
export const countries: Country[] = [
  { iso: "BD", name: "Bangladesh", dial: "+880", flag: { src: "/flags/bd.svg", alt: "", width: 20, height: 20 }, emoji: "🇧🇩", pattern: "^1[3-9]\\d{8}$" },
  { iso: "IN", name: "India", dial: "+91", emoji: "🇮🇳", pattern: "^[6-9]\\d{9}$" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971", emoji: "🇦🇪", pattern: "^5\\d{8}$" },
  { iso: "GB", name: "United Kingdom", dial: "+44", emoji: "🇬🇧", pattern: "^7\\d{9}$" },
  { iso: "US", name: "United States", dial: "+1", emoji: "🇺🇸", pattern: "^[2-9]\\d{9}$" },
  { iso: "CA", name: "Canada", dial: "+1", emoji: "🇨🇦", pattern: "^[2-9]\\d{9}$" },
  { iso: "AU", name: "Australia", dial: "+61", emoji: "🇦🇺", pattern: "^4\\d{8}$" },
];

export const defaultCountryIso = "BD";

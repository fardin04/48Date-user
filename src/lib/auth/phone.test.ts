import { describe, expect, it } from "vitest";
import { countries } from "@/data/auth/countries";
import { isValidNational, maskPhone, normalizeNational, toPhoneNumber } from "./phone";

const country = (iso: string) => {
  const found = countries.find((c) => c.iso === iso);
  if (!found) throw new Error(`Country ${iso} not found`);
  return found;
};

describe("phone number validation and normalization", () => {
  describe("Bangladesh (BD +880)", () => {
    const bd = country("BD");

    it("accepts valid 10-digit national numbers", () => {
      expect(isValidNational(bd, "1811000401")).toBe(true);
      expect(isValidNational(bd, "1712345678")).toBe(true);
      expect(isValidNational(bd, "1300000000")).toBe(true);
      expect(isValidNational(bd, "1999999999")).toBe(true);
    });

    it("normalizes and accepts local format with leading 0", () => {
      expect(isValidNational(bd, "01811000401")).toBe(true);
      expect(normalizeNational(bd, "01811000401")).toBe("1811000401");
      expect(toPhoneNumber(bd, "01811000401")).toEqual({ dial: "+880", national: "1811000401" });
    });

    it("strips formatting like spaces, hyphens and parentheses", () => {
      expect(isValidNational(bd, "018-1100-0401")).toBe(true);
      expect(isValidNational(bd, "018 1100 0401")).toBe(true);
      expect(toPhoneNumber(bd, "018-1100-0401")).toEqual({ dial: "+880", national: "1811000401" });
    });

    it("rejects invalid BD prefixes and lengths", () => {
      expect(isValidNational(bd, "1211000401")).toBe(false); // 12 is not valid in BD
      expect(isValidNational(bd, "1011000401")).toBe(false); // 10 is not valid
      expect(isValidNational(bd, "181100040")).toBe(false);  // too short (9 digits)
      expect(isValidNational(bd, "18110004012")).toBe(false); // too long (11 digits)
      expect(isValidNational(bd, "")).toBe(false);
      expect(isValidNational(bd, "abcdefghij")).toBe(false);
    });
  });

  describe("starter countries", () => {
    it("validates India (IN +91)", () => {
      const inCountry = country("IN");
      expect(isValidNational(inCountry, "9876543210")).toBe(true);
      expect(isValidNational(inCountry, "6123456789")).toBe(true);
      expect(isValidNational(inCountry, "5123456789")).toBe(false); // starts with 5
      expect(isValidNational(inCountry, "987654321")).toBe(false); // 9 digits
    });

    it("validates United Arab Emirates (AE +971)", () => {
      const ae = country("AE");
      expect(isValidNational(ae, "501234567")).toBe(true);
      expect(isValidNational(ae, "401234567")).toBe(false);
      expect(isValidNational(ae, "50123456")).toBe(false);
    });

    it("validates United Kingdom (GB +44)", () => {
      const gb = country("GB");
      expect(isValidNational(gb, "7123456789")).toBe(true);
      expect(isValidNational(gb, "07123456789")).toBe(true);
      expect(isValidNational(gb, "6123456789")).toBe(false);
    });

    it("validates United States and Canada (US/CA +1)", () => {
      const us = country("US");
      const ca = country("CA");
      expect(isValidNational(us, "2125551234")).toBe(true);
      expect(isValidNational(ca, "4165551234")).toBe(true);
      expect(isValidNational(us, "1125551234")).toBe(false); // area code cannot start with 1
    });

    it("validates Australia (AU +61)", () => {
      const au = country("AU");
      expect(isValidNational(au, "412345678")).toBe(true);
      expect(isValidNational(au, "0412345678")).toBe(true);
      expect(isValidNational(au, "312345678")).toBe(false);
    });
  });

  describe("maskPhone", () => {
    it("masks national digits keeping dial code and last 4 digits", () => {
      const masked = maskPhone({ dial: "+880", national: "1811000401" });
      expect(masked).toContain("+880");
      expect(masked).toContain("0401");
      expect(masked).toContain("••••••");
    });
  });
});

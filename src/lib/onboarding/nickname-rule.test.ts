import { describe, expect, it } from "vitest";
import { isValidNickname, NICKNAME_MAX_LENGTH } from "@/lib/onboarding/nickname-rule";

describe("nickname rule (API: 3–20 characters, starts with a letter, letters / digits / _ / .)", () => {
  it.each(["Sun", "Aura_Love99", "city.lights", "A".repeat(20), "x_1"])("accepts %s", (name) => {
    expect(isValidNickname(name)).toBe(true);
  });

  it.each(["", "Su", "A".repeat(21), "1sunny", "_sunny", ".sunny", "sun ny", "sunny!", "sünny", "sun-ny", " Sunny"])("rejects %j", (name) => {
    expect(isValidNickname(name)).toBe(false);
  });

  it("caps the field at the rule's maximum", () => {
    expect(NICKNAME_MAX_LENGTH).toBe(20);
  });
});

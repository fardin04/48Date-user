import { describe, expect, it } from "vitest";
import { getFiltersPage } from "@/stores/portal-store";
import { distanceFromKm, distanceToKm, parseAge, preferenceFacts } from "./preference-facts";

describe("distance: miles ↔ maxDistanceKm", () => {
  it("sends each option in whole kilometres, and Any distance as null", () => {
    expect(distanceToKm("5")).toBe(8);
    expect(distanceToKm("15")).toBe(24);
    expect(distanceToKm("30")).toBe(48);
    expect(distanceToKm("50")).toBe(80);
    expect(distanceToKm("any")).toBeNull();
  });

  it("reads a saved distance as the nearest option", () => {
    expect(distanceFromKm(null)).toBe("any");
    expect(distanceFromKm(24)).toBe("15");
    expect(distanceFromKm(1)).toBe("5");
    expect(distanceFromKm(30)).toBe("15");
    expect(distanceFromKm(40)).toBe("30");
    expect(distanceFromKm(65)).toBe("50");
    // Beyond the largest option (set elsewhere, e.g. the app): the largest option.
    expect(distanceFromKm(500)).toBe("50");
  });

  it("round-trips every option", () => {
    for (const option of ["5", "15", "30", "50", "any"] as const) expect(distanceFromKm(distanceToKm(option))).toBe(option);
  });
});

describe("age range 18–80", () => {
  it("accepts whole ages inside the limits", () => {
    expect(parseAge("18")).toBe(18);
    expect(parseAge(" 35 ")).toBe(35);
    expect(parseAge("80")).toBe(80);
  });

  it("refuses anything else", () => {
    for (const value of ["", "17", "81", "100", "25.5", "-20", "abc", "2 5", "1000"]) expect(parseAge(value)).toBeNull();
  });

  it("matches the limits named in the validation copy", () => {
    const { ageLimits, ageInvalid } = getFiltersPage();
    expect(ageLimits).toEqual({ min: 18, max: 80 });
    expect(ageInvalid).toBe("Enter an age from 18 to 80.");
  });
});

describe("preference facts", () => {
  it("lists the saved preferences in the order asked", () => {
    const facts = preferenceFacts({ meet: "women", distance: "any", minAge: 22, maxAge: 35, verifiedOnly: false, sharedInterest: true }, "Dhaka", ["interestedIn", "ageRange", "distance"]);
    expect(facts.map((fact) => fact.value)).toEqual(["Women", "22–35", "Any distance"]);
  });
});

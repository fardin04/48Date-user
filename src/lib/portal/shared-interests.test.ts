import { describe, expect, it } from "vitest";
import { getMemberCopy } from "@/stores/portal-store";
import type { Member } from "@/data/portal/types";
import { sharedInterestLabels, sharedInterestsText } from "./shared-interests";

const theirs = [
  { id: "a1", label: "Coffee" },
  { id: "b2", label: "Hiking" },
  { id: "c3", label: "K-Drama" },
];

describe("sharedInterestLabels", () => {
  it("matches the member's own interests by id, in the profile's order", () => {
    expect(sharedInterestLabels(theirs, ["c3", "a1"])).toEqual(["Coffee", "K-Drama"]);
  });

  it("also matches by label, ignoring case and spaces", () => {
    expect(sharedInterestLabels(theirs, [" hiking ", "k-drama"])).toEqual(["Hiking", "K-Drama"]);
  });

  it("is empty when nothing is shared, or either side has no interests", () => {
    expect(sharedInterestLabels(theirs, ["zz"])).toEqual([]);
    expect(sharedInterestLabels(theirs, [])).toEqual([]);
    expect(sharedInterestLabels([], ["a1"])).toEqual([]);
  });
});

describe("sharedInterestsText", () => {
  const member = (sharedInterests: string[] | undefined) => ({ sharedInterests }) as Member;
  const { shared } = getMemberCopy();

  it("says none, one or the count", () => {
    expect(sharedInterestsText(member([]))).toBe(shared.none);
    expect(sharedInterestsText(member(undefined))).toBe(shared.none);
    expect(sharedInterestsText(member(["Coffee"]))).toBe(shared.one);
    expect(sharedInterestsText(member(["Coffee", "Hiking", "Art"]))).toBe("3 shared interests");
  });
});

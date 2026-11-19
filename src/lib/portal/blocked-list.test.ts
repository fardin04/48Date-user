import { describe, expect, it } from "vitest";
import {
  formatUnblockLabel,
  isBlockedEmpty,
  mergeBlockedPages,
  removeBlockedMember,
} from "./blocked-list";

describe("blocked-list pure logic (Phase 31)", () => {
  describe("mergeBlockedPages", () => {
    it("returns an empty array when pages is null, undefined, or empty", () => {
      expect(mergeBlockedPages(null)).toEqual([]);
      expect(mergeBlockedPages(undefined)).toEqual([]);
      expect(mergeBlockedPages([])).toEqual([]);
    });

    it("merges multiple pages while preserving order", () => {
      const page1 = { items: ["wildrose", "user_b"] };
      const page2 = { items: ["user_c", "user_d"] };
      expect(mergeBlockedPages([page1, page2])).toEqual(["wildrose", "user_b", "user_c", "user_d"]);
    });

    it("deduplicates members across pages", () => {
      const page1 = { items: ["wildrose", "user_b"] };
      const page2 = { items: ["user_b", "user_c"] };
      expect(mergeBlockedPages([page1, page2])).toEqual(["wildrose", "user_b", "user_c"]);
    });
  });

  describe("removeBlockedMember", () => {
    it("removes the target member from the list", () => {
      const list = ["wildrose", "user_b", "user_c"];
      expect(removeBlockedMember(list, "user_b")).toEqual(["wildrose", "user_c"]);
    });

    it("returns the original list if target is not present", () => {
      const list = ["wildrose", "user_b"];
      expect(removeBlockedMember(list, "unknown")).toEqual(["wildrose", "user_b"]);
    });

    it("handles null and empty lists gracefully", () => {
      expect(removeBlockedMember(null, "wildrose")).toEqual([]);
      expect(removeBlockedMember([], "wildrose")).toEqual([]);
    });
  });

  describe("isBlockedEmpty", () => {
    it("detects empty lists for transition to BLOCKED-EMPTY", () => {
      expect(isBlockedEmpty([])).toBe(true);
      expect(isBlockedEmpty(null)).toBe(true);
      expect(isBlockedEmpty(undefined)).toBe(true);
      expect(isBlockedEmpty(["wildrose"])).toBe(false);
    });
  });

  describe("formatUnblockLabel", () => {
    it("formats the unblock label with the target member name", () => {
      expect(formatUnblockLabel("Unblock {name}", "WildRose")).toBe("Unblock WildRose");
      expect(formatUnblockLabel("Unblock {name}?", "Maya Lin")).toBe("Unblock Maya Lin?");
    });
  });
});

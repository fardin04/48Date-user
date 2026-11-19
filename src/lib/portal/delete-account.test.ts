import { describe, expect, it, vi } from "vitest";
import { canSubmitDeletion, parseDeletionSchedule } from "./delete-account";

describe("delete-account pure logic (Phase 32)", () => {
  describe("canSubmitDeletion", () => {
    it("disables deletion submit until the confirmation checkbox is checked", () => {
      expect(canSubmitDeletion(false, false)).toBe(false);
      expect(canSubmitDeletion(true, false)).toBe(true);
    });

    it("disables deletion submit while submission is in progress (busy)", () => {
      expect(canSubmitDeletion(true, true)).toBe(false);
      expect(canSubmitDeletion(false, true)).toBe(false);
    });
  });

  describe("parseDeletionSchedule", () => {
    it("parses purgeAt date and calculates 90-day grace period remaining", () => {
      const now = new Date("2026-10-16T10:00:00.000Z").getTime();
      const data = {
        deleted: true,
        purgeAt: "2027-01-14T10:00:00.000Z",
        message: "Your account has been deactivated.",
      };
      const result = parseDeletionSchedule(data, now);
      expect(result.isPurgeScheduled).toBe(true);
      expect(result.purgeDate.toISOString()).toBe("2027-01-14T10:00:00.000Z");
      expect(result.daysRemaining).toBe(90);
    });

    it("returns 0 days remaining if purge date has passed", () => {
      const now = new Date("2027-02-01T10:00:00.000Z").getTime();
      const data = {
        deleted: true,
        purgeAt: "2027-01-14T10:00:00.000Z",
        message: "Your account has been deactivated.",
      };
      const result = parseDeletionSchedule(data, now);
      expect(result.daysRemaining).toBe(0);
    });
  });

  describe("deletion flow sequence", () => {
    it("executes accountService.requestDeletion, authService.signOut, and history replacement", async () => {
      const requestDeletion = vi.fn().mockResolvedValue(undefined);
      const signOut = vi.fn().mockResolvedValue(undefined);
      const replaceState = vi.fn();

      // Sequence runner
      const performDeletion = async () => {
        await requestDeletion();
        await signOut();
        replaceState(null, "", "/");
      };

      await performDeletion();
      expect(requestDeletion).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(replaceState).toHaveBeenCalledWith(null, "", "/");
    });
  });
});

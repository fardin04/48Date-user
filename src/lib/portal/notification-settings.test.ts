import { describe, expect, it } from "vitest";
import { notificationKeys, type NotificationPrefs } from "@/data/portal/account";
import { getAccountPage } from "@/stores/portal-store";

describe("notification settings mapping (Phase 29)", () => {
  it("maps exactly to the API's five categories", () => {
    expect(notificationKeys).toEqual(["matches", "messages", "dates", "games", "announcements"]);
  });

  it("provides copy for all five notification categories", () => {
    const { options } = getAccountPage().notifyPrefs;
    for (const key of notificationKeys) {
      expect(options[key]).toBeDefined();
      expect(typeof options[key]).toBe("string");
      expect(options[key].length).toBeGreaterThan(0);
    }
  });

  it("folds match expiry into matches and date reminders into dates", () => {
    const { options } = getAccountPage().notifyPrefs;
    expect(options.matches.toLowerCase()).toContain("expiry");
    expect(options.dates.toLowerCase()).toContain("reminder");
  });

  it("handles full category toggle objects", () => {
    const prefs: NotificationPrefs = {
      matches: true,
      messages: true,
      dates: false,
      games: false,
      announcements: true,
    };

    expect(prefs.matches).toBe(true);
    expect(prefs.dates).toBe(false);
    expect(Object.keys(prefs).sort()).toEqual([...notificationKeys].sort());
  });
});

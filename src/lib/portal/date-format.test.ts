import { describe, expect, it } from "vitest";
import { dateWindowError, zonedToIso } from "./date-format";

/** Phase 16: `scheduledAt` from day + time + timezone, and the API's 1 hour – 14 days window. */
describe("scheduledAt", () => {
  it("converts the wall clock of the plan's timezone, across a daylight-saving change", () => {
    expect(zonedToIso("2026-11-20", 16 * 60, "Asia/Dhaka")).toBe("2026-11-20T10:00:00.000Z");
    // London leaves summer time on 25 Oct 2026: 4 PM is 15:00 UTC before and 16:00 UTC after.
    expect(zonedToIso("2026-10-24", 16 * 60, "Europe/London")).toBe("2026-10-24T15:00:00.000Z");
    expect(zonedToIso("2026-10-26", 16 * 60, "Europe/London")).toBe("2026-10-26T16:00:00.000Z");
  });
});

describe("dateWindowError", () => {
  // 18 Nov 2026, 12:00 in Dhaka.
  const now = Date.parse("2026-11-18T06:00:00.000Z");

  it("refuses past times and times under an hour away (disabled slots)", () => {
    expect(dateWindowError("2026-11-18", 11 * 60, "Asia/Dhaka", now)).toBe("early");
    expect(dateWindowError("2026-11-18", 12 * 60 + 30, "Asia/Dhaka", now)).toBe("early");
    expect(dateWindowError("2026-11-18", 13 * 60, "Asia/Dhaka", now)).toBeNull();
  });

  it("refuses more than 14 days ahead", () => {
    expect(dateWindowError("2026-12-02", 12 * 60, "Asia/Dhaka", now)).toBeNull();
    expect(dateWindowError("2026-12-02", 12 * 60 + 30, "Asia/Dhaka", now)).toBe("late");
    expect(dateWindowError("2026-12-10", 16 * 60, "Asia/Dhaka", now)).toBe("late");
  });

  it("reads the time in the plan's timezone, not the browser's", () => {
    // 1 PM in London is 13:00 UTC: 7 hours from now, fine; 1 PM in Dhaka is an hour away, also fine; 12:30 PM Dhaka is not.
    expect(dateWindowError("2026-11-18", 13 * 60, "Europe/London", now)).toBeNull();
    expect(dateWindowError("2026-11-18", 6 * 60, "Europe/London", now)).toBe("early");
  });
});

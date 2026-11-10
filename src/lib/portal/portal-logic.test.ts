import { afterEach, describe, expect, it, vi } from "vitest";
import { memberIdPattern } from "@/data/portal/types";
import { formatStamp, isoToZoned, zonedToIso } from "./date-format";

describe("timezones (date plans)", () => {
  it("turns a wall-clock time into the right instant", () => {
    expect(zonedToIso("2026-10-25", 19 * 60, "Asia/Dhaka")).toBe("2026-10-25T13:00:00.000Z");
    expect(zonedToIso("2026-07-01", 9 * 60, "America/New_York")).toBe("2026-07-01T13:00:00.000Z");
    expect(zonedToIso("2026-12-01", 9 * 60, "America/New_York")).toBe("2026-12-01T14:00:00.000Z");
  });

  it("round-trips, also around a daylight-saving change", () => {
    for (const zone of ["Europe/London", "America/Los_Angeles", "Asia/Dhaka", "UTC"]) {
      const iso = zonedToIso("2026-03-29", 16 * 60 + 30, zone);
      expect(isoToZoned(iso, zone)).toEqual({ day: "2026-03-29", minutes: 16 * 60 + 30 });
    }
  });

  it("reads an unknown zone as UTC instead of failing", () => {
    expect(zonedToIso("2026-10-25", 60, "Not/AZone")).toBe("2026-10-25T01:00:00.000Z");
  });
});

describe("message and notification times", () => {
  // Local wall-clock times, so the test reads the same in every zone.
  const now = new Date(2026, 10, 10, 0, 10).getTime();
  const time = (at: number) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(at);

  it("shows only the time today, and the calendar day (not 24 hours) before that", () => {
    const earlier = new Date(2026, 10, 10, 0, 1).getTime();
    expect(formatStamp(earlier, now)).toBe(time(earlier));
    // Twenty minutes ago, but before midnight: yesterday.
    const lateLastNight = new Date(2026, 10, 9, 23, 50).getTime();
    expect(formatStamp(lateLastNight, now)).toBe(`Yesterday, ${time(lateLastNight)}`);
    expect(formatStamp(lateLastNight, now, false)).toBe("Yesterday");
  });

  it("names the weekday within a week, then the date, adding the year for another year", () => {
    const monday = new Date(2026, 10, 7, 9, 0).getTime();
    expect(formatStamp(monday, now, false)).toBe(new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(monday));
    const october = new Date(2026, 9, 24, 9, 0).getTime();
    expect(formatStamp(october, now, false)).toBe(new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(october));
    expect(formatStamp(new Date(2025, 11, 31, 9, 0).getTime(), now, false)).toMatch(/2025/);
  });
});

describe("member ids (URL segments)", () => {
  it("accepts nicknames and rejects anything else", () => {
    for (const ok of ["GoldenHour", "wildflower", "Aura_99", "j.doe"]) expect(memberIdPattern.test(ok)).toBe(true);
    for (const bad of ["9lives", "ab", "a-b-c", "x".repeat(21), "../etc", "<script>", ""]) expect(memberIdPattern.test(bad)).toBe(false);
  });
});

describe("photo URLs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("keeps https URLs, resolves keys only with a media host and drops other schemes", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", "https://media.example.com/");
    const { mediaUrl, distanceText } = await import("./api-members");
    expect(mediaUrl("https://r2.example.com/a.webp?sig=1")).toBe("https://r2.example.com/a.webp?sig=1");
    expect(mediaUrl("users/a/photo.webp")).toBe("https://media.example.com/users/a/photo.webp");
    expect(mediaUrl("javascript:alert(1)")).toBeNull();
    expect(mediaUrl("data:image/png;base64,AAA")).toBeNull();
    expect(mediaUrl(null)).toBeNull();
    expect(distanceText(4)).toBe("2 miles away");
    expect(distanceText(1)).toBe("1 mile away");
  });

  it("drops storage keys when no media host is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", "");
    const { mediaUrl } = await import("./api-members");
    expect(mediaUrl("users/a/photo.webp")).toBeNull();
  });
});

describe("portal routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("opens only the sample members without the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const { resolvePortalView } = await import("./views");
    expect(resolvePortalView("chats", ["goldenhour"])).toEqual({ kind: "chat", member: "goldenhour" });
    expect(resolvePortalView("chats", ["SomeoneElse"])).toBeNull();
  });

  it("opens any valid nickname with the API, never a malformed one", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000/api/v1");
    const { resolvePortalView } = await import("./views");
    expect(resolvePortalView("chats", ["SomeoneElse"])).toEqual({ kind: "chat", member: "SomeoneElse" });
    expect(resolvePortalView("dates", ["venues", "Aura_99"])).toEqual({ kind: "date", step: "venues", member: "Aura_99" });
    expect(resolvePortalView("stories", ["story", "0193a1b2-c3d4-7000-8000-000000000001"])).toEqual({ kind: "story", id: "0193a1b2-c3d4-7000-8000-000000000001" });
    expect(resolvePortalView("chats", ["%E0%A4%A"])).toBeNull();
    expect(resolvePortalView("chats", ["<b>"])).toBeNull();
    expect(resolvePortalView("discover", ["unknown", "GoldenHour"])).toBeNull();
  });
});

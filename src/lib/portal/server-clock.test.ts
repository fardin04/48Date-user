import { afterEach, describe, expect, it, vi } from "vitest";
import { timeLeft } from "@/lib/format";

/** Phase 11: countdowns follow the server's clock (`meta.serverTime`), never go negative, and a match without `expiresAt` has no timer. */
async function fresh() {
  vi.resetModules();
  return import("./server-clock");
}

afterEach(() => vi.useRealTimers());

describe("server clock", () => {
  it("shifts server timestamps by the offset between the server clock and the device clock", async () => {
    vi.useFakeTimers({ now: Date.parse("2026-10-16T09:00:00.000Z") }); // the device is one hour behind
    const clock = await fresh();
    clock.syncServerClock("2026-10-16T10:00:00.000Z");
    // The match ends at 12:00 server time, 11:00 on this device: two hours from now either way.
    expect(clock.toLocalTime("2026-10-16T12:00:00.000Z")).toBe(Date.parse("2026-10-16T11:00:00.000Z"));
    expect(timeLeft(clock.toLocalTime("2026-10-16T12:00:00.000Z")!, Date.now()).totalMinutes).toBe(120);
  });

  it("two devices with different clocks show the same time left once both synced", async () => {
    const serverNow = "2026-10-16T10:00:00.000Z";
    const expiresAt = "2026-10-17T08:00:00.000Z";
    const left: number[] = [];
    for (const skewMs of [-90_000, 3_600_000]) {
      vi.useFakeTimers({ now: Date.parse(serverNow) + skewMs });
      const clock = await fresh();
      clock.syncServerClock(serverNow);
      left.push(timeLeft(clock.toLocalTime(expiresAt)!, Date.now()).totalMinutes);
    }
    expect(left[0]).toBe(left[1]);
    expect(left[0]).toBe(22 * 60);
  });

  it("ignores a missing or unreadable serverTime", async () => {
    vi.useFakeTimers({ now: Date.parse("2026-10-16T10:00:00.000Z") });
    const clock = await fresh();
    clock.syncServerClock(undefined);
    clock.syncServerClock("not a date");
    expect(clock.toLocalTime("2026-10-16T12:00:00.000Z")).toBe(Date.parse("2026-10-16T12:00:00.000Z"));
  });

  it("maps a null or unreadable expiresAt to null (an open match without a timer)", async () => {
    const clock = await fresh();
    expect(clock.toLocalTime(null)).toBeNull();
    expect(clock.toLocalTime(undefined)).toBeNull();
    expect(clock.toLocalTime("soon")).toBeNull();
  });

  it("never counts below zero once the deadline has passed", () => {
    expect(timeLeft(1_000, 10_000_000)).toEqual({ totalMinutes: 0, hours: "0", paddedHours: "00", minutes: "00" });
  });
});

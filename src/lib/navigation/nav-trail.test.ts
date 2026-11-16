import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRAIL_CAP, TRAIL_KEY, clear, markReplace, nextTrail, parseTrail, readTrail, record, resolveBack } from "./nav-trail";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  };
}

describe("nextTrail", () => {
  it("pushes a new page", () => {
    expect(nextTrail(["/matches"], "/chats/goldenhour")).toEqual(["/matches", "/chats/goldenhour"]);
  });
  it("pops when the browser goes back to the previous page", () => {
    expect(nextTrail(["/settings", "/settings/privacy"], "/settings")).toEqual(["/settings"]);
  });
  it("ignores a re-render of the same page", () => {
    expect(nextTrail(["/settings"], "/settings")).toEqual(["/settings"]);
  });
  it("replaces the last entry after a replace navigation", () => {
    expect(nextTrail(["/chats/a", "/dates/plan/a"], "/dates/venues/a", true)).toEqual(["/chats/a", "/dates/venues/a"]);
  });
  it("starts a trail with a replace when it is empty", () => {
    expect(nextTrail([], "/discover", true)).toEqual(["/discover"]);
  });
  it("keeps only the newest entries", () => {
    const long = Array.from({ length: TRAIL_CAP }, (_, i) => `/p${i}`);
    const next = nextTrail(long, "/new");
    expect(next).toHaveLength(TRAIL_CAP);
    expect(next.at(-1)).toBe("/new");
    expect(next[0]).toBe("/p1");
  });
});

describe("parseTrail", () => {
  it("drops invalid storage", () => {
    expect(parseTrail(null)).toEqual([]);
    expect(parseTrail("not json")).toEqual([]);
    expect(parseTrail('{"a":1}')).toEqual([]);
    expect(parseTrail('["/ok", 3, "https://evil.example", "/fine"]')).toEqual(["/ok", "/fine"]);
  });
});

describe("resolveBack", () => {
  it("goes back through history to the previous in-app page", () => {
    expect(resolveBack(["/matches", "/chats/goldenhour"], "/chats/goldenhour", "/chats")).toEqual({ kind: "history", href: "/matches" });
  });
  it("uses the fallback on direct entry (no previous page)", () => {
    expect(resolveBack(["/settings/privacy"], "/settings/privacy", "/settings")).toEqual({ kind: "push", href: "/settings" });
    expect(resolveBack([], "/settings/privacy", "/settings")).toEqual({ kind: "push", href: "/settings" });
  });
  it("uses the fallback when the trail does not end on the current page", () => {
    expect(resolveBack(["/matches", "/stories"], "/chats/goldenhour", "/chats")).toEqual({ kind: "push", href: "/chats" });
  });
  it("never returns to sign-in, sign-up or the guided setup", () => {
    expect(resolveBack(["/signin/verified", "/discover/filters"], "/discover/filters", "/discover")).toEqual({ kind: "push", href: "/discover" });
    expect(resolveBack(["/onboarding/ready", "/matches/complete"], "/matches/complete", "/matches")).toEqual({ kind: "push", href: "/matches" });
  });
});

describe("trail store", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", memoryStorage());
    clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("records visits, pops on browser Back and replaces after markReplace", () => {
    record("/settings");
    record("/settings/privacy");
    expect(readTrail()).toEqual(["/settings", "/settings/privacy"]);
    record("/settings");
    expect(readTrail()).toEqual(["/settings"]);
    record("/dates/plan/a");
    markReplace();
    record("/dates/venues/a");
    expect(readTrail()).toEqual(["/settings", "/dates/venues/a"]);
    // The replace flag applies to one visit only.
    record("/dates/place/a");
    expect(readTrail()).toEqual(["/settings", "/dates/venues/a", "/dates/place/a"]);
  });

  it("reads tampered storage as an empty trail and clears it", () => {
    sessionStorage.setItem(TRAIL_KEY, "{broken");
    expect(readTrail()).toEqual([]);
    record("/discover");
    expect(readTrail()).toEqual(["/discover"]);
    clear();
    expect(sessionStorage.getItem(TRAIL_KEY)).toBeNull();
  });
});

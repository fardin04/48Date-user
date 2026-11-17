import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { profileDraft } from "@/lib/onboarding/profile-draft";

const KEY = "48date.onboarding.draft";
let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal("sessionStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
});
afterEach(() => vi.unstubAllGlobals());

describe("profileDraft (sessionStorage, validated on read)", () => {
  it("drops values of the wrong type and keeps the rest", () => {
    store.set(KEY, JSON.stringify({ fields: { nickname: "Sunny", height: 170, dob: null, occupation: "Designer" }, interests: ["a", 2, null, "b"], area: { label: "Dhaka", source: "device" } }));
    expect(profileDraft.read()).toEqual({ fields: { nickname: "Sunny", occupation: "Designer" }, interests: ["a", "b"], area: { label: "Dhaka", source: "device" } });
  });

  it("drops an area with an unknown source or no label", () => {
    store.set(KEY, JSON.stringify({ fields: {}, interests: [], area: { label: "Dhaka", source: "gps", latitude: 23.8 } }));
    expect(profileDraft.read().area).toBeUndefined();
    store.set(KEY, JSON.stringify({ fields: {}, interests: [], area: { source: "manual" } }));
    expect(profileDraft.read().area).toBeUndefined();
  });

  it("reads broken or foreign values as the empty draft", () => {
    for (const raw of ["{not json", "null", "[1,2]", '"text"', JSON.stringify({ fields: [1], interests: "a" })]) {
      store.set(KEY, raw);
      expect(profileDraft.read()).toEqual({ fields: {}, interests: [], area: undefined });
    }
    store.delete(KEY);
    expect(profileDraft.read()).toEqual({ fields: {}, interests: [] });
  });

  it("saves changes as they happen and keeps earlier answers (Back never discards them)", () => {
    profileDraft.setFields({ nickname: "Sunny" });
    profileDraft.setFields({ dob: "1995-04-02" });
    expect(profileDraft.read().fields).toEqual({ nickname: "Sunny", dob: "1995-04-02" });
    profileDraft.clear();
    expect(store.has(KEY)).toBe(false);
  });

  it("never stores coordinates: the draft keeps only an area label", () => {
    profileDraft.update((draft) => ({ ...draft, area: { label: "Near your current location", source: "device" } }));
    expect(store.get(KEY)).not.toMatch(/latitude|longitude/);
  });
});

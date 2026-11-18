import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { datePage } from "@/data/portal/dates";
import { replayFetch, type Call } from "@/test/postman-replay";
import { areaFromPosition, AREA_RADIUS_KM, rankByArea, validArea, type DateArea } from "./date-area";

/** Phase 15: the date-specific area (rule 55) — ranking, validation, storage, and that the profile location is never touched. */
const BASE = "http://localhost:3000/api/v1";
const MATCH = "019283aa-0000-7000-8000-000000000001";
const banani: DateArea = { label: "Banani, Dhaka", lat: 23.79, lng: 90.4 };
const ok = (data: unknown) => ({ success: true, data });

function memoryStorage() {
  const store = new Map<string, string>();
  return { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value), removeItem: (key: string) => void store.delete(key), store };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("rankByArea", () => {
  const places = [
    { id: "uttara", at: { lat: 23.87, lng: 90.4 } },
    { id: "gulshan", at: { lat: 23.78, lng: 90.42 } },
    { id: "chattogram", at: { lat: 22.36, lng: 91.78 } },
    { id: "unknown", at: null },
  ];

  it("keeps every place in order without an area", () => {
    expect(rankByArea(places, (place) => place.at, null).map(({ item, km }) => [item.id, km])).toEqual([
      ["uttara", null],
      ["gulshan", null],
      ["chattogram", null],
      ["unknown", null],
    ]);
  });

  it("orders by haversine distance from the area centre and drops places beyond the radius", () => {
    const ranked = rankByArea(places, (place) => place.at, banani);
    expect(ranked.map(({ item }) => item.id)).toEqual(["gulshan", "uttara"]);
    expect(ranked[0].km).toBeCloseTo(2.3, 0);
    expect(ranked[1].km).toBeCloseTo(8.9, 0);
    expect(ranked.every(({ km }) => km !== null && km <= AREA_RADIUS_KM)).toBe(true);
  });

  it("is empty when nothing lies within the radius", () => {
    expect(rankByArea(places, (place) => place.at, { label: "London", lat: 51.51, lng: -0.13 })).toEqual([]);
  });
});

describe("validArea and areaFromPosition", () => {
  it("accepts only a labelled, in-range position", () => {
    expect(validArea(banani)).toEqual(banani);
    expect(validArea({ label: "", lat: 1, lng: 1 })).toBeNull();
    expect(validArea({ label: "X", lat: 120, lng: 1 })).toBeNull();
    expect(validArea({ label: "X", lat: "23", lng: 90 })).toBeNull();
    expect(validArea(null)).toBeNull();
  });

  it("names a device position after its starter area (its centre), else rounds it to 0.01°", () => {
    expect(areaFromPosition(23.7941, 90.4043, "Near you")).toEqual(banani);
    expect(areaFromPosition(-33.86882, 151.20929, "Near you")).toEqual({ label: "Near you", lat: -33.87, lng: 151.21 });
  });
});

describe("the dates data and screens", () => {
  const destinations = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(destinations);
    if (typeof value !== "object" || value === null) return [];
    const screen = (value as { screen?: unknown }).screen;
    return [...(typeof screen === "string" ? [screen] : []), ...Object.values(value).flatMap(destinations)];
  };

  it("never links to the onboarding or settings location (bug N2)", () => {
    const screens = destinations(datePage);
    expect(screens).not.toContain("LOCATION");
    expect(screens).not.toContain("SETTINGS-LOCATION");
  });

  it("never call the profile-location writers", () => {
    const dir = join(process.cwd(), "src", "components", "sections", "portal", "dates");
    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), "utf-8");
      expect(source, file).not.toMatch(/saveLocation|onboardingService|accountService|to\("LOCATION"\)/);
    }
  });
});

describe("api date service area", () => {
  async function load() {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
    vi.stubGlobal("window", globalThis);
    const storage = memoryStorage();
    vi.stubGlobal("sessionStorage", storage);
    const replay = replayFetch(BASE, {
      [`POST /matches/${MATCH}/venue-suggestions`]: ok({
        runId: "run-1",
        matchId: MATCH,
        status: "COMPLETED",
        venues: [
          { venueRef: "far", name: "Uttara Café", address: null, category: "CAFE", isAiPick: true, latitude: 23.87, longitude: 90.4, rating: 4.9, photoUrl: null, distanceKmFromMe: 9 },
          { venueRef: "near", name: "Gulshan Bistro", address: null, category: "RESTAURANT", isAiPick: false, latitude: 23.78, longitude: 90.42, rating: 4.5, photoUrl: null, distanceKmFromMe: 3 },
          { venueRef: "away", name: "Port Café", address: null, category: "CAFE", isAiPick: false, latitude: 22.36, longitude: 91.78, rating: 4.1, photoUrl: null, distanceKmFromMe: 200 },
        ],
        aiPickRef: "far",
      }),
    });
    vi.stubGlobal("fetch", replay.fetchStub);
    const { tokenStore } = await import("@/lib/api/tokens");
    tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
    return { dates: (await import("@/lib/portal/api-date-service")).apiDateService, calls: replay.calls as Call[], storage };
  }

  it("stores the area in the plan draft only and re-ranks the suggestions by it", async () => {
    const { dates, calls, storage } = await load();
    expect((await dates.getVenues("GoldenHour")).map((venue) => venue.id)).toEqual(["far", "near", "away"]);

    const plan = await dates.setPlanArea("GoldenHour", banani);
    expect(plan.area).toEqual(banani);
    expect(JSON.parse(storage.store.get("48date.dates.drafts")!).goldenhour.area).toEqual(banani);

    const ranked = await dates.getVenues("GoldenHour");
    expect(ranked.map((venue) => venue.id)).toEqual(["near", "far"]);
    expect(ranked[0].areaDistance).toBe("2.3 km from Banani, Dhaka");
    // One suggestions run, and nothing sent to the profile location.
    expect(calls.filter((call) => call.method === "POST" && call.path.endsWith("/venue-suggestions"))).toHaveLength(1);
    expect(calls.some((call) => call.path.startsWith("/users/me/location") || call.method === "PATCH")).toBe(false);
  });

  it("drops a tampered stored area on read", async () => {
    const { dates, storage } = await load();
    storage.setItem("48date.dates.drafts", JSON.stringify({ goldenhour: { area: { label: "X", lat: "nope", lng: 1 } } }));
    expect((await dates.getPlan("GoldenHour")).area).toBeNull();
  });
});

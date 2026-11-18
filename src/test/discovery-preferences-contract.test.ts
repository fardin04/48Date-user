import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 8 contract: `GET` / `PUT /discovery/preferences` (who to meet, ages, miles ↔ `maxDistanceKm`,
 * verified only, shared interests), the cache after a save, the new deck it queues, and the API's
 * refusals, against the example responses of `postman/48Date-Backend.postman_collection.json`.
 */
const BASE = "http://localhost:3000/api/v1";

let calls: Call[];

/** Fresh modules; `refusal` answers the PUT with that status and body instead of the 202 example. */
async function load(refusal?: { status: number; body: unknown }) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE);
  calls = replay.calls;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const response = await replay.fetchStub(input, init);
    if (refusal && init.method === "PUT" && String(input).endsWith("/discovery/preferences")) return new Response(JSON.stringify(refusal.body), { status: refusal.status });
    return response;
  });
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return {
    portal: (await import("@/lib/portal/api-portal-service")).apiPortalService,
    failureReason: (await import("@/lib/portal/failure")).failureReason,
  };
}

const count = (method: string, path: string) => calls.filter((call) => call.method === method && call.path === path).length;
const put = () => calls.find((call) => call.method === "PUT" && call.path === "/discovery/preferences")?.body as Record<string, unknown>;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /discovery/preferences", () => {
  it("reads no distance limit as Any distance and saved interests as sharing one", async () => {
    const { portal } = await load();
    expect(await portal.getPreferences()).toEqual({ meet: "women", distance: "any", minAge: 22, maxAge: 35, verifiedOnly: false, sharedInterest: true });
    expect(calls[0]).toMatchObject({ method: "GET", path: "/discovery/preferences", auth: "Bearer test-access" });
  });
});

describe("PUT /discovery/preferences", () => {
  it("sends the form in the API's shape: miles as whole km, Any distance as null", async () => {
    const { portal } = await load();
    await portal.savePreferences({ meet: "everyone", distance: "any", minAge: 30, maxAge: 45, verifiedOnly: false, sharedInterest: false });
    expect(put()).toEqual({ interestedIn: "EVERYONE", ageMin: 30, ageMax: 45, maxDistanceKm: null, verifiedOnly: false, interestIds: [] });
  });

  it("re-reads the saved values from the server's answer (no second GET) and builds a new deck", async () => {
    const { portal } = await load();
    await portal.getDeck();
    const runs = count("POST", "/discovery/runs");
    await portal.savePreferences({ meet: "women", distance: "30", minAge: 22, maxAge: 35, verifiedOnly: false, sharedInterest: true });
    expect(put()).toMatchObject({ maxDistanceKm: 48 });
    const reads = count("GET", "/discovery/preferences");
    // The 202 answer says maxDistanceKm 30 → the nearest option, 15 miles (24 km).
    expect((await portal.getPreferences()).distance).toBe("15");
    expect(count("GET", "/discovery/preferences")).toBe(reads);
    await portal.getDeck();
    expect(count("POST", "/discovery/runs")).toBe(runs + 1);
  });

  it("Reset filters saves the defaults: everyone, 15 miles, 25–35, verified only, shared interest", async () => {
    const { portal } = await load();
    expect(await portal.resetPreferences()).toEqual({ meet: "everyone", distance: "15", minAge: 25, maxAge: 35, verifiedOnly: true, sharedInterest: true });
    expect(put()).toMatchObject({ interestedIn: "EVERYONE", ageMin: 25, ageMax: 35, maxDistanceKm: 24, verifiedOnly: true });
    expect((put().interestIds as string[]).length).toBeGreaterThan(0);
  });

  it("refuses verified-only on a free plan with the API's own message, for the form to show", async () => {
    const body = { success: false, message: "The feature 'ADVANCED_FILTERS' requires a subscription upgrade", error: { code: "ENTITLEMENT_REQUIRED", details: { entitlement: "ADVANCED_FILTERS", upgradeAvailable: true } } };
    const { portal, failureReason } = await load({ status: 403, body });
    const error = await portal.resetPreferences().catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 403, code: "ENTITLEMENT_REQUIRED" });
    expect(failureReason(error)).toBe("The feature 'ADVANCED_FILTERS' requires a subscription upgrade");
  });

  it("refuses an out-of-range distance as a validation failure", async () => {
    const body = { success: false, message: "Validation failed", error: { code: "VALIDATION_FAILED", details: [{ field: "maxDistanceKm", message: "maxDistanceKm must be between 1 and 500 or null" }] } };
    const { portal } = await load({ status: 400, body });
    await expect(portal.savePreferences({ meet: "women", distance: "50", minAge: 22, maxAge: 35, verifiedOnly: false, sharedInterest: false })).rejects.toMatchObject({ status: 400, code: "VALIDATION_FAILED" });
  });
});

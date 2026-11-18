import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 9 contract: `GET /discovery/profile/:nickname` for an active profile, an unavailable one
 * (200 with `availability: UNAVAILABLE`) and an unknown one (404), against the examples of
 * `postman/48Date-Backend.postman_collection.json`.
 */
const BASE = "http://localhost:3000/api/v1";

type Example = { name: string; code: number; body: string };
type Item = { name: string; item?: Item[]; request?: { url: string | { raw: string } }; response?: Example[] };

function profileExample(name: string): Example {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "postman", "48Date-Backend.postman_collection.json"), "utf-8")) as { item: Item[] };
  const found: Example[] = [];
  const walk = (items: Item[]) => {
    for (const item of items) {
      if (item.item) walk(item.item);
      const raw = typeof item.request?.url === "string" ? item.request.url : item.request?.url.raw;
      if (raw?.includes("/discovery/profile/")) found.push(...(item.response ?? []));
    }
  };
  walk(collection.item);
  return found.find((example) => example.name.includes(name))!;
}

let calls: Call[];

/** Fresh modules; `profile` answers `GET /discovery/profile/:nickname` with that example. */
async function load(profile?: Example) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE);
  calls = replay.calls;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const response = await replay.fetchStub(input, init);
    if (profile && String(input).includes("/discovery/profile/")) return new Response(profile.body, { status: profile.code });
    return response;
  });
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return (await import("@/lib/portal/api-portal-service")).apiPortalService;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /discovery/profile/:nickname", () => {
  it("maps an active profile from the API only (no sample copy), with the interests both share", async () => {
    const portal = await load(profileExample("Active Profile Detail"));
    const member = await portal.getMember("wildflower");
    expect(calls.find((call) => call.path === "/discovery/profile/wildflower")).toMatchObject({ method: "GET", auth: "Bearer test-access" });
    expect(member).toMatchObject({ id: "wildflower", name: "wildflower", age: 26, verified: true, compatibility: null, bio: "Architect, coffee enthusiast and weekend hiker." });
    // No compatibility score exists: shared interests are the member's own interests found in the profile.
    expect(Array.isArray(member?.sharedInterests)).toBe(true);
    expect(member?.profileInterests.length).toBeGreaterThan(0);
    for (const label of member?.sharedInterests ?? []) expect(member?.profileInterests).toContain(label);
  });

  it("reads an unavailable profile (200, availability UNAVAILABLE) as no member: MEMBER-UNAVAILABLE", async () => {
    const portal = await load(profileExample("Unavailable Profile"));
    expect(await portal.getMember("wildflower")).toBeNull();
  });

  it("reads an unknown nickname (404 USER_NOT_FOUND) as no member too", async () => {
    const portal = await load(profileExample("USER_NOT_FOUND"));
    expect(await portal.getMember("nobody_here")).toBeNull();
  });

  it("asks for the nickname as given, encoded in the path", async () => {
    const portal = await load(profileExample("Active Profile Detail"));
    await portal.getMember("golden.hour_1");
    expect(calls.some((call) => call.path === "/discovery/profile/golden.hour_1")).toBe(true);
  });
});

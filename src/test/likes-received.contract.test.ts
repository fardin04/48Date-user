import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 10 contract: `GET /discovery/likes-received`, `POST /discovery/likes-received/:nickname/match`
 * and `/pass`, against the examples of `postman/48Date-Backend.postman_collection.json` (both list
 * modes), plus the cache refreshes a like back causes and the refusals the page shows.
 */
const BASE = "http://localhost:3000/api/v1";

type Example = { name: string; code: number; body: string };
type Item = { name: string; item?: Item[]; request?: { url: string | { raw: string } }; response?: Example[] };

function likesExample(name: string): Example {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "postman", "48Date-Backend.postman_collection.json"), "utf-8")) as { item: Item[] };
  const found: Example[] = [];
  const walk = (items: Item[]) => {
    for (const item of items) {
      if (item.item) walk(item.item);
      const raw = typeof item.request?.url === "string" ? item.request.url : item.request?.url.raw;
      if (raw?.includes("/discovery/likes-received")) found.push(...(item.response ?? []));
    }
  };
  walk(collection.item);
  return found.find((example) => example.name.includes(name))!;
}

let calls: Call[];

/** Fresh modules; `override` answers the first matching path with that status and body. */
async function load(override?: { path: string; status: number; body: string }) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE);
  calls = replay.calls;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const response = await replay.fetchStub(input, init);
    if (override && String(input).includes(override.path)) return new Response(override.body, { status: override.status });
    return response;
  });
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return {
    portal: (await import("@/lib/portal/api-portal-service")).apiPortalService,
    client: (await import("@/lib/api/query-client")).getQueryClient(),
    keys: (await import("@/lib/api/modules/cache-keys")).cacheKeys,
    likes: await import("@/lib/portal/likes"),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /discovery/likes-received", () => {
  it("reads page 1 of 20 with the bearer token and maps photo, name, age, km, verified and Super Like", async () => {
    const { portal } = await load();
    const page = await portal.getLikesReceived(1);
    const call = calls.find((entry) => entry.path === "/discovery/likes-received");
    expect(call).toMatchObject({ method: "GET", auth: "Bearer test-access" });
    expect(page).toMatchObject({ page: 1, hasMore: false, total: 1 });
    expect(page.items).toEqual([
      {
        id: "Wildflower",
        name: "Wildflower",
        age: 25,
        photo: expect.objectContaining({ src: "https://cdn.48date.local/users/Wildflower/photos/photo1.jpg" }),
        verified: true,
        superLike: true,
        distanceKm: 4,
        locked: false,
      },
    ]);
  });

  it("asks for the page and limit in the query", async () => {
    const { portal } = await load();
    const urls: string[] = [];
    const inner = globalThis.fetch;
    vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) => {
      urls.push(String(input));
      return inner(input, init);
    });
    await portal.getLikesReceived(2);
    expect(urls.find((url) => url.includes("/discovery/likes-received"))).toMatch(/[?&]page=2(&|$)/);
    expect(urls.find((url) => url.includes("/discovery/likes-received"))).toMatch(/[?&]limit=20(&|$)/);
  });

  it("keeps a paywalled list locked: masked name and blurred photo as the API sent them", async () => {
    const blurred = likesExample("Blurred Paywall");
    const { portal } = await load({ path: "/discovery/likes-received", status: blurred.code, body: blurred.body });
    const [item] = (await portal.getLikesReceived(1)).items;
    expect(item).toMatchObject({ name: "••••••", age: null, locked: true });
    expect(item.photo.src).toContain("blur=80");
  });
});

describe("POST /discovery/likes-received/:nickname/match and /pass", () => {
  it("a like back returns the match, and refreshes the likes, matches and conversations", async () => {
    const { portal, client, keys } = await load();
    const spy = vi.spyOn(client, "invalidateQueries");
    expect(await portal.matchLike("Wildflower")).toEqual({ matched: true });
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/discovery/likes-received/Wildflower/match", auth: "Bearer test-access" });
    const invalidated = spy.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey));
    expect(invalidated).toEqual(expect.arrayContaining([JSON.stringify(keys.likesReceived), JSON.stringify(keys.matches), JSON.stringify(keys.conversations)]));
  });

  it("a pass records the swipe without a match and refreshes the likes", async () => {
    const { portal, client, keys } = await load();
    const spy = vi.spyOn(client, "invalidateQueries");
    await portal.passLike("Wildflower");
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/discovery/likes-received/Wildflower/pass" });
    expect(spy.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey))).toContain(JSON.stringify(keys.likesReceived));
  });

  it("someone who already matched or left (409 / 404) is a gone card with the API's message; a 429 isn't", async () => {
    const taken = JSON.stringify({ success: false, message: "You already matched with this member.", error: { code: "ALREADY_MATCHED" } });
    const { portal, likes } = await load({ path: "/match", status: 409, body: taken });
    const error = await portal.matchLike("Wildflower").catch((caught: unknown) => caught);
    expect(likes.isGoneLike(error)).toBe(true);
    expect(error).toMatchObject({ status: 409, message: "You already matched with this member." });
    const limited = await load({ path: "/pass", status: 429, body: JSON.stringify({ statusCode: 429, message: "Too many requests", error: "Too Many Requests" }) });
    const refused = await limited.portal.passLike("Wildflower").catch((caught: unknown) => caught);
    expect(limited.likes.isGoneLike(refused)).toBe(false);
  });
});

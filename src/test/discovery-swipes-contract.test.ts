import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 7 contract: `POST /discovery/swipes` with a mutual match and with the weekly Super Like
 * limit (429), and the background match popup (`GET /matches/unseen`, `POST /matches/:id/seen`),
 * against the example responses of `postman/48Date-Backend.postman_collection.json`.
 */
const BASE = "http://localhost:3000/api/v1";

type Example = { name: string; code: number; body: string };
type Item = { name: string; item?: Item[]; request?: { url: string | { raw: string } }; response?: Example[] };

/** The named example of the swipe endpoint ("Mutual Match Created", "Super Likes Quota Exhausted"). */
function swipeExample(name: string): Example {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "postman", "48Date-Backend.postman_collection.json"), "utf-8")) as { item: Item[] };
  const found: Example[] = [];
  const walk = (items: Item[]) => {
    for (const item of items) {
      if (item.item) walk(item.item);
      const raw = typeof item.request?.url === "string" ? item.request.url : item.request?.url.raw;
      if (raw?.endsWith("/discovery/swipes")) found.push(...(item.response ?? []));
    }
  };
  walk(collection.item);
  return found.find((example) => example.name.includes(name))!;
}

let calls: Call[];

/** Fresh modules; `swipe` answers `POST /discovery/swipes` with that example instead of the first 2xx. */
async function load(swipe?: Example) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE);
  calls = replay.calls;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const response = await replay.fetchStub(input, init);
    const url = String(input instanceof Request ? input.url : input);
    if (swipe && init.method === "POST" && url.endsWith("/discovery/swipes")) return new Response(swipe.body, { status: swipe.code });
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

describe("POST /discovery/swipes", () => {
  it("reports a mutual like as a match, sending the deck's run", async () => {
    const portal = await load(swipeExample("Mutual Match Created"));
    await portal.getDeck();
    expect(await portal.decide("Wildflower", "like")).toEqual({ matched: true });
    const sent = calls.find((call) => call.method === "POST" && call.path === "/discovery/swipes");
    expect(sent).toMatchObject({ auth: "Bearer test-access", body: { targetNickname: "Wildflower", action: "LIKE", source: "DECK" } });
    expect((sent?.body as { runId?: string }).runId).toEqual(expect.any(String));
    // A decided card leaves the deck.
    expect((await portal.getDeck()).remaining).not.toContain("Wildflower");
  });

  it("sends a profile decision without the run", async () => {
    const portal = await load();
    expect(await portal.decide("Wildflower", "pass", "profile")).toEqual({ matched: false });
    const sent = calls.find((call) => call.path === "/discovery/swipes")?.body as Record<string, unknown>;
    expect(sent).toMatchObject({ action: "PASS", source: "PROFILE" });
    expect(sent.runId).toBeUndefined();
  });

  it("refuses a Super Like past the weekly limit with the API's message, and keeps the card", async () => {
    const portal = await load(swipeExample("Super Likes Quota Exhausted"));
    expect((await portal.getDeck()).remaining).toContain("Wildflower");
    await expect(portal.decide("Wildflower", "super")).rejects.toMatchObject({
      status: 429,
      message: "You have used all your Super Likes for this week. Please try again later.",
    });
    expect(calls.filter((call) => call.path === "/discovery/swipes")).toHaveLength(1);
    // Not recorded, so the card is still there on the next read (the deck is re-read after every decision).
    expect((await portal.getDeck()).remaining).toContain("Wildflower");
  });
});

describe("background matches", () => {
  it("offers the first unseen match, then marks that match seen", async () => {
    const portal = await load();
    expect(await portal.getUnseenMatch()).toBe("GoldenHour");
    await portal.markMatchSeen("GoldenHour");
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/matches/019283aa-0000-7000-8000-000000000001/seen" });
  });
});

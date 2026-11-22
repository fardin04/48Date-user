import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 11 contract: `GET /matches?tab=` (all / cancelled / completed, cursor paging) and the match
 * lookup, against `postman/48Date-Backend.postman_collection.json`, plus the live `latestDate.place`
 * shape, the "feedback already sent" flag and the matches refresh a sent message causes.
 */
const BASE = "http://localhost:3000/api/v1";
let calls: Call[];

type Item = { item?: Item[]; request?: { url: string | { raw: string } }; response?: { code: number; body: string }[] };

function listExample() {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "postman", "48Date-Backend.postman_collection.json"), "utf-8")) as { item: Item[] };
  let body = "";
  const walk = (items: Item[]) => {
    for (const item of items) {
      if (item.item) walk(item.item);
      const raw = typeof item.request?.url === "string" ? item.request.url : item.request?.url.raw;
      if (raw?.startsWith("{{baseUrl}}/matches?tab=")) body = item.response!.find((response) => response.code === 200)!.body;
    }
  };
  walk(collection.item);
  return JSON.parse(body) as { data: Record<string, unknown>[] };
}

const sample = listExample().data[0];

/** A completed match as the live API sends it (`place: { name, address }`, `myRatingDone`). */
const completed = (nickname: string, rated: boolean) => ({
  ...sample,
  id: `m-${nickname}`,
  otherUser: { ...(sample.otherUser as object), nickname },
  displayStatus: "COMPLETED",
  expiresAt: null,
  clockStoppedAt: "2026-10-15T09:00:00.000Z",
  latestDate: { id: `d-${nickname}`, status: "COMPLETED", place: { name: "Amber & Oak Coffee", address: "Gulshan 2" }, scheduledAt: "2026-10-24T10:00:00.000Z", myRatingDone: rated },
});

const page = (data: unknown[], meta: Record<string, unknown> = { nextCursor: null, hasMore: false }) => ({ status: "success", data, meta });

/** Fresh modules; `answer` may replace the collection's body for a URL. */
async function load(answer?: (url: URL) => unknown) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE);
  calls = replay.calls;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const response = await replay.fetchStub(input, init);
    const body = answer?.(new URL(String(input)));
    return body === undefined ? response : new Response(JSON.stringify(body), { status: 200 });
  });
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return {
    portal: (await import("@/lib/portal/api-portal-service")).apiPortalService,
    chatApi: (await import("@/lib/api/modules/chat-api")).chatApi,
    client: (await import("@/lib/api/query-client")).getQueryClient(),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /matches", () => {
  it("reads tab=all with the bearer token and maps the collection's match onto a card", async () => {
    const { portal } = await load();
    const matches = await portal.getMatches();
    expect(calls.find((call) => call.path === "/matches")?.auth).toBe("Bearer test-access");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ member: "GoldenHour", confirmed: false });
    expect(matches[0].expiresAt).toBeNull(); // Postman of 2026-11-21: the example match now has `clockStoppedAt` set (was a running clock).
  });

  it("maps the tabs onto the API's tab values (completed, not complete)", async () => {
    const tabs: string[] = [];
    const { portal } = await load((url) => {
      if (url.pathname.endsWith("/matches")) tabs.push(url.searchParams.get("tab")!);
      return undefined;
    });
    await portal.getOutcomes("cancelled");
    await portal.getOutcomes("complete");
    expect(tabs).toEqual(["cancelled", "completed"]);
  });

  it("pages an outcome tab by cursor and stops when hasMore is false", async () => {
    const { portal } = await load((url) => {
      if (!url.pathname.endsWith("/matches")) return undefined;
      return url.searchParams.get("cursor")
        ? page([completed("WildRose", false)])
        : page([completed("GoldenHour", true)], { nextCursor: "m-GoldenHour", hasMore: true });
    });
    const first = await portal.getOutcomes("complete");
    expect(first.next).toBe("m-GoldenHour");
    const second = await portal.getOutcomes("complete", first.next!);
    expect(second.next).toBeNull();
    expect(second.outcomes[0].member).toBe("WildRose");
    expect(calls.filter((call) => call.path === "/matches")).toHaveLength(2);
  });

  it("reads the venue from latestDate.place and marks dates whose feedback is already sent", async () => {
    const { portal } = await load((url) => (url.pathname.endsWith("/matches") ? page([completed("GoldenHour", true), completed("WildRose", false)]) : undefined));
    const { outcomes } = await portal.getOutcomes("complete");
    expect(outcomes[0].meta).toContain("Amber & Oak Coffee");
    expect(outcomes.map((outcome) => outcome.rated)).toEqual([true, false]);
  });

  it("drops EXPIRED matches from the lookup, so their detail shows MATCH-EXPIRED", async () => {
    const { portal } = await load((url) => (url.pathname.endsWith("/matches") ? page([{ ...sample, displayStatus: "EXPIRED" }]) : undefined));
    expect(await portal.getMatch("GoldenHour")).toBeNull();
  });

  it("an open match with expiresAt null has no countdown", async () => {
    const { portal } = await load((url) => (url.pathname.endsWith("/matches") ? page([{ ...sample, expiresAt: null }]) : undefined));
    expect((await portal.getMatch("GoldenHour"))?.expiresAt).toBeNull();
  });
});

describe("message preview on the match cards", () => {
  it("a sent message marks the matches cache stale", async () => {
    const { portal, chatApi, client } = await load();
    await portal.getMatches();
    expect(client.getQueryCache().findAll({ queryKey: ["matches"] }).length).toBeGreaterThan(0);
    await chatApi.send("019283aa-0000-7000-8000-000000000099", { type: "TEXT", body: "hi", clientMessageId: "c1" } as never).catch(() => undefined);
    expect(client.getQueryCache().findAll({ queryKey: ["matches"] }).every((query) => query.state.isInvalidated)).toBe(true);
  });
});

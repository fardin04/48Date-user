import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

const BASE = "http://localhost:3000/api/v1";
let calls: Call[];

async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const session = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => session.get(k) ?? null,
    setItem: (k: string, v: string) => void session.set(k, v),
    removeItem: (k: string) => void session.delete(k),
    clear: () => void session.clear(),
  });
  const replay = replayFetch(BASE, overrides);
  calls = [];
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const path = url.pathname.replace(new URL(BASE).pathname.replace(/\/$/, ""), "");
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    calls.push({
      method,
      path: `${path}${url.search}`,
      body: typeof init.body === "string" ? JSON.parse(init.body) : init.body ?? null,
      auth: headers.get("Authorization"),
    });

    if (path === "/blocks" && method === "GET") {
      const cursor = url.searchParams.get("cursor");
      if (cursor === "cursor_page_2") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Blocked users retrieved successfully",
            data: [
              {
                id: "b-002",
                nickname: "SecondBlocked",
                photoUrl: null,
                blockedAt: "2026-10-24T12:00:00.000Z",
                source: "PROFILE",
              },
            ],
            meta: { nextCursor: null, hasMore: false },
          }),
          { status: 200 }
        );
      }
      if (cursor === "cursor_page_1") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Blocked users retrieved successfully",
            data: [
              {
                id: "b-001",
                nickname: "WildRose",
                photoUrl: "users/wildrose/photos/main.webp",
                blockedAt: "2026-10-23T19:35:00.000Z",
                source: "CHAT",
              },
            ],
            meta: { nextCursor: "cursor_page_2", hasMore: true },
          }),
          { status: 200 }
        );
      }
    }

    return replay.fetchStub(input, init);
  });

  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access-token", refreshToken: "test-refresh-token" });

  const { apiChatService } = await import("@/lib/portal/api-chat-service");
  return { chat: apiChatService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("blocked users contract tests (Phase 31)", () => {
  it("fetches blocked users using Postman example response", async () => {
    const { chat } = await load();
    const result = await chat.getBlocked();
    expect(result).toEqual(["WildRose"]);
    const getCall = calls.find((c) => c.method === "GET" && c.path.startsWith("/blocks"));
    expect(getCall).toBeDefined();
    expect(getCall?.auth).toBe("Bearer test-access-token");
  });

  it("paginates blocked users with cursor and limit", async () => {
    const { chat } = await load();
    const page1 = await chat.getBlockedPage("cursor_page_1", 20);
    expect(page1.items).toEqual(["WildRose"]);
    expect(page1.next).toBe("cursor_page_2");

    const page2 = await chat.getBlockedPage(page1.next, 20);
    expect(page2.items).toEqual(["SecondBlocked"]);
    expect(page2.next).toBeNull();

    expect(calls.filter((c) => c.method === "GET" && c.path.startsWith("/blocks"))).toHaveLength(2);
  });

  it("unblocks a member with DELETE /blocks/:nickname and sends bearer token", async () => {
    const { chat } = await load();
    await chat.unblock("WildRose");
    const deleteCall = calls.find((c) => c.method === "DELETE" && c.path === "/blocks/WildRose");
    expect(deleteCall).toBeDefined();
    expect(deleteCall?.auth).toBe("Bearer test-access-token");
  });
});

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

    if (path === "/notifications" && method === "GET") {
      const cursor = url.searchParams.get("cursor");
      if (cursor === "cursor_page_2") {
        return new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                id: "notif_2",
                userId: "user_1",
                type: "GAME_INVITE",
                category: "GAMES",
                title: "Game invitation",
                body: "farhana invited you to play a game",
                imageUrl: null,
                actor: { nickname: "farhana", availability: "ACTIVE", age: 25, mainPhotoUrl: "https://r2.48date.com/p2.jpg", isVerified: true },
                target: { screen: "GAME" },
                createdAt: "2026-11-02T10:00:00.000Z",
                readAt: "2026-11-02T11:00:00.000Z",
              },
            ],
            meta: { nextCursor: null, hasMore: false, unreadCount: 0 },
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: "notif_1",
              userId: "user_1",
              type: "DATE_INVITE_RECEIVED",
              category: "DATES",
              title: "New date invitation",
              body: "sara sent you a date invitation",
              imageUrl: null,
              actor: { nickname: "sara", availability: "ACTIVE", age: 26, mainPhotoUrl: "https://r2.48date.com/p1.jpg", isVerified: true },
              target: { screen: "DATE_DETAIL", params: { dateId: "d1" } },
              createdAt: "2026-11-02T09:00:00.000Z",
              readAt: null,
            },
          ],
          meta: { nextCursor: "cursor_page_2", hasMore: true, unreadCount: 1 },
        }),
        { status: 200 }
      );
    }

    if (path === "/notifications/unread-count" && method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          data: { unreadCount: 3 },
        }),
        { status: 200 }
      );
    }

    if (path === "/notifications/read-all" && method === "POST") {
      return new Response(
        JSON.stringify({
          success: true,
          data: { updated: 3 },
        }),
        { status: 200 }
      );
    }

    return replay.fetchStub(input, init);
  });

  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "fake-token", refreshToken: "fake-refresh" });
  const { apiAccountService } = await import("@/lib/portal/api-account-service");
  return { account: apiAccountService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("notifications contract", () => {
  it("fetches paginated notifications and parses cursor, avatar, and target", async () => {
    const { account } = await load();
    const firstPage = await account.getNotificationsPage();

    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.items[0]).toMatchObject({
      id: "notif_1",
      title: "New date invitation",
      description: "sara sent you a date invitation",
      unread: true,
      to: { screen: "DATE-PENDING", param: "sara" },
    });
    expect(firstPage.items[0].avatar?.src).toBe("https://r2.48date.com/p1.jpg");
    expect(firstPage.next).toBe("cursor_page_2");

    const secondPage = await account.getNotificationsPage(firstPage.next);
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]).toMatchObject({
      id: "notif_2",
      title: "Game invitation",
      unread: false,
      to: { screen: "GAMES", param: "farhana" },
    });
    expect(secondPage.next).toBeNull();
  });

  it("reads unread count and marks all as read", async () => {
    const { account } = await load();
    const count = await account.getUnreadCount();
    expect(count).toBe(3);

    await account.markNotificationsRead();
    const postCall = calls.find((c) => c.method === "POST" && c.path.includes("/notifications/read-all"));
    expect(postCall).toBeDefined();
  });
});

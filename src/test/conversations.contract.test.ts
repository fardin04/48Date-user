import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 12 contract: `GET /conversations` (the INBOX and side list) against the collection's example,
 * and the match cards' last message read from that same list when `/matches` sends
 * `lastMessagePreview: null` (as the live API does).
 */
const BASE = "http://localhost:3000/api/v1";
let calls: Call[];

async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE, overrides);
  calls = replay.calls;
  vi.stubGlobal("fetch", replay.fetchStub);
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return {
    chat: (await import("@/lib/portal/api-chat-service")).apiChatService,
    portal: (await import("@/lib/portal/api-portal-service")).apiPortalService,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /conversations", () => {
  it("maps partner, last-message preview, unread count and time, with the bearer token", async () => {
    const { chat } = await load();
    const list = await chat.getConversations();
    expect(calls.find((call) => call.path === "/conversations")?.auth).toBe("Bearer test-access");
    expect(list[0]).toMatchObject({ member: "Noah_Reed", preview: "📅 Date invitation: North End Coffee Roasters", unread: 1, blocked: false });
    expect(list[0].at).toBe(Date.parse("2026-10-27T09:00:00.000Z"));
    expect(list[1]).toMatchObject({ member: "Liam_Chen", unread: 0 });
  });

  it("reads the list once for every card's last message (no request per card)", async () => {
    const conversationId = "c1234567-89ab-cdef-0123-456789abcdef";
    const match = {
      id: "m1",
      otherUser: { availability: "ACTIVE", nickname: "Noah_Reed", age: 32, mainPhotoUrl: null, isVerified: true },
      displayStatus: "ACTIVE",
      actions: ["MESSAGE"],
      createdAt: "2026-10-27T08:00:00.000Z",
      expiresAt: "2026-10-29T08:00:00.000Z",
      clockStoppedAt: null,
      latestDate: null,
      conversationId,
      lastMessagePreview: null,
      lastActivityAt: null,
    };
    const { portal } = await load({ "GET /matches": { success: true, data: [match, { ...match, id: "m2", conversationId: null, otherUser: { ...match.otherUser, nickname: "Quiet" } }], meta: { hasMore: false, nextCursor: null } } });
    const matches = await portal.getMatches();
    expect(matches[0].preview).toBe("📅 Date invitation: North End Coffee Roasters");
    // No conversation yet: an open match keeps the "say hello" line.
    expect(matches[1].preview.length).toBeGreaterThan(0);
    expect(calls.filter((call) => call.path === "/conversations")).toHaveLength(1);
  });

  it("a confirmed date without any message shows no made-up preview", async () => {
    const match = {
      id: "m1",
      otherUser: { availability: "ACTIVE", nickname: "Dated", age: 30, mainPhotoUrl: null, isVerified: true },
      displayStatus: "DATE_COMPLETED",
      actions: ["MESSAGE"],
      createdAt: "2026-10-27T08:00:00.000Z",
      expiresAt: "2026-10-29T08:00:00.000Z",
      clockStoppedAt: "2026-10-28T08:00:00.000Z",
      latestDate: { id: "d1", status: "COMPLETED" },
      conversationId: null,
      lastMessagePreview: null,
      lastActivityAt: null,
    };
    const { portal } = await load({ "GET /matches": { success: true, data: [match], meta: { hasMore: false, nextCursor: null } } });
    expect((await portal.getMatches())[0]).toMatchObject({ confirmed: true, preview: "" });
  });
});

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
      path,
      body: typeof init.body === "string" ? JSON.parse(init.body) : init.body ?? null,
      auth: headers.get("Authorization"),
    });

    if (init.method === "POST" && path.includes("/respond") && overrides.respondForbidden) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "FORBIDDEN", message: "Only the invited partner can respond to this story" },
        }),
        { status: 403 }
      );
    }
    if (path.includes("/users/me/success-stories") && url.search.includes("role=partner")) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: "story-uuid-1",
              datePlanId: "date-plan-uuid-1",
              matchId: "match-uuid-1",
              title: "Our First Date in Gulshan",
              body: "We met at Cafe Nero after matching on 48Date!",
              imageUrl: "https://r2.48date.com/users/alice/story.jpg",
              status: "PENDING_PARTNER",
              partnerRespondedAt: null,
              reviewedAt: null,
              rejectionReason: null,
              likesCount: 0,
              commentsCount: 0,
              isLikedByMe: false,
              author: { availability: "ACTIVE", nickname: "alice_w", age: 26, avatarUrl: "https://r2.48date.com/users/alice_w/avatar.jpg", isVerified: true },
              partner: { availability: "ACTIVE", nickname: "bob_m", age: 28, avatarUrl: "https://r2.48date.com/users/bob_m/avatar.jpg", isVerified: true },
              createdAt: "2026-10-21T12:00:00.000Z",
              updatedAt: "2026-10-21T12:00:00.000Z",
            },
          ],
          message: "Your success stories retrieved successfully",
        }),
        { status: 200 }
      );
    }
    return replay.fetchStub(input, init);
  });
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return (await import("@/lib/portal/api-story-service")).apiStoryService;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("story partner consent and respond contract (Phase 23)", () => {
  it("approves story consent via POST /success-stories/:id/respond with accept=true", async () => {
    const stories = await load();
    await stories.respond("story-uuid-1", true);

    const call = calls.find((c) => c.method === "POST" && c.path === "/success-stories/story-uuid-1/respond");
    expect(call).toBeDefined();
    expect(call?.body).toEqual({ accept: true });
    expect(call?.auth).toBe("Bearer test-access");
  });

  it("declines story consent via POST /success-stories/:id/respond with accept=false", async () => {
    const stories = await load();
    await stories.respond("story-uuid-1", false);

    const call = calls.find((c) => c.method === "POST" && c.path === "/success-stories/story-uuid-1/respond");
    expect(call).toBeDefined();
    expect(call?.body).toEqual({ accept: false });
    expect(call?.auth).toBe("Bearer test-access");
  });

  it("propagates 403 Forbidden when caller is not the invited partner", async () => {
    const stories = await load({ respondForbidden: true });
    await expect(stories.respond("story-uuid-1", true)).rejects.toThrow("Only the invited partner can respond to this story");
  });

  it("fetches stories pending partner approval via GET /users/me/success-stories?role=partner&status=PENDING_PARTNER", async () => {
    const stories = await load();
    const pending = await stories.getPendingPartnerStories();

    const call = calls.find((c) => c.method === "GET" && c.path === "/users/me/success-stories");
    expect(call).toBeDefined();
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending[0].stage).toBe("PENDING_PARTNER");
    expect(pending[0].title).toBe("Our First Date in Gulshan");
  });
});

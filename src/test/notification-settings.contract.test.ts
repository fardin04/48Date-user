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
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body ?? null;
    calls.push({
      method,
      path: `${path}${url.search}`,
      body,
      auth: headers.get("Authorization"),
    });

    if (path === "/users/me/notification-settings") {
      if (method === "GET") {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              matches: true,
              messages: true,
              dates: true,
              games: false,
              announcements: false,
            },
          }),
          { status: 200 }
        );
      }
      if (method === "PUT") {
        return new Response(
          JSON.stringify({
            success: true,
            data: body,
          }),
          { status: 200 }
        );
      }
    }

    return replay.fetchStub(input, init);
  });

  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "token-1", refreshToken: "refresh-1" });
  const { apiAccountService } = await import("@/lib/portal/api-account-service");
  return { apiAccountService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET and PUT /users/me/notification-settings contract (Phase 29)", () => {
  it("fetches current notification preferences", async () => {
    const { apiAccountService } = await load();
    const prefs = await apiAccountService.getNotificationPrefs();

    expect(prefs).toEqual({
      matches: true,
      messages: true,
      dates: true,
      games: false,
      announcements: false,
    });
    const getCall = calls.find((c) => c.path === "/users/me/notification-settings" && c.method === "GET");
    expect(getCall).toBeDefined();
  });

  it("updates notification settings with PUT", async () => {
    const { apiAccountService } = await load();
    const updated = {
      matches: false,
      messages: true,
      dates: false,
      games: true,
      announcements: true,
    };

    await apiAccountService.saveNotificationPrefs(updated);
    const putCall = calls.find((c) => c.path === "/users/me/notification-settings" && c.method === "PUT");
    expect(putCall).toBeDefined();
    expect(putCall?.body).toEqual(updated);
  });
});

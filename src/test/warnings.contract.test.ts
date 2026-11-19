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

    return replay.fetchStub(input, init);
  });

  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access-token", refreshToken: "test-refresh-token" });

  const { apiAccountService } = await import("@/lib/portal/api-account-service");
  return { account: apiAccountService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("moderation warnings contract tests (Phase 35)", () => {
  it("reads pending warnings via GET /users/me/warnings/pending with bearer authorization", async () => {
    const { account } = await load();
    const warnings = await account.getWarnings();

    const getCall = calls.find((c) => c.method === "GET" && c.path === "/users/me/warnings/pending");
    expect(getCall).toBeDefined();
    expect(getCall?.auth).toBe("Bearer test-access-token");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toEqual({
      id: "warn-123",
      category: "Harassment or bullying",
      message: "You have received a formal warning regarding: Harassment. Please follow our community guidelines.",
    });
  });

  it("acknowledges a pending warning via POST /users/me/warnings/:id/acknowledge", async () => {
    const { account } = await load();
    await account.acknowledgeWarning("warn-123");

    const ackCall = calls.find((c) => c.method === "POST" && c.path === "/users/me/warnings/warn-123/acknowledge");
    expect(ackCall).toBeDefined();
    expect(ackCall?.auth).toBe("Bearer test-access-token");
  });
});

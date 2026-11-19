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

  const { apiMembershipService } = await import("@/lib/portal/api-membership-service");
  return { membership: apiMembershipService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("subscription management contract tests (Phase 34)", () => {
  it("starts a dummy subscription with POST /subscriptions/start", async () => {
    const { membership } = await load();
    const result = await membership.checkout("monthly");
    expect(result).toBe("paid");

    const startCall = calls.find((c) => c.method === "POST" && c.path === "/subscriptions/start");
    expect(startCall).toBeDefined();
    expect(startCall?.auth).toBe("Bearer test-access-token");
    expect(startCall?.body).toMatchObject({
      planKey: "PREMIUM",
      billingInterval: "MONTHLY",
    });
  });

  it("cancels future renewal with POST /subscriptions/cancel", async () => {
    const { membership } = await load();
    await membership.stopRenewal();

    const cancelCall = calls.find((c) => c.method === "POST" && c.path === "/subscriptions/cancel");
    expect(cancelCall).toBeDefined();
    expect(cancelCall?.auth).toBe("Bearer test-access-token");
  });
});

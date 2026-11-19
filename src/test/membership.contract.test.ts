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

describe("membership & pricing plans contract tests (Phase 33)", () => {
  it("retrieves the active subscription plans from the API catalogue", async () => {
    const { membership } = await load();
    const plans = await membership.getPlans();
    expect(plans.length).toBeGreaterThan(0);
    const weekly = plans.find((p) => p.id === "weekly");
    const monthly = plans.find((p) => p.id === "monthly");
    const yearly = plans.find((p) => p.id === "yearly");

    expect(weekly?.price).toBe("$4.99");
    expect(monthly?.price).toBe("$14.99");
    expect(yearly?.price).toBe("$59.99");
    expect(yearly?.headline).toBe("$5.00/mo");

    const getPlansCall = calls.find((c) => c.method === "GET" && c.path === "/subscriptions/plans");
    expect(getPlansCall).toBeDefined();
  });

  it("retrieves my active premium subscription status", async () => {
    const { membership } = await load();
    const status = await membership.getMembership();

    expect(status.plan).toBe("monthly");
    expect(status.renews).toBe(true);
    expect(status.periodEnds).toBe("2026-11-23");

    const getMeCall = calls.find((c) => c.method === "GET" && c.path === "/subscriptions/me");
    expect(getMeCall).toBeDefined();
    expect(getMeCall?.auth).toBe("Bearer test-access-token");
  });

  it("handles free plan status and conversation allowances", async () => {
    const { membership } = await load({
      "GET /subscriptions/me": {
        success: true,
        data: {
          isPremium: false,
          planKey: "FREE",
          planName: "Free",
          subscription: null,
        },
      },
    });

    const status = await membership.getMembership();
    expect(status.plan).toBeNull();
    expect(status.renews).toBe(false);
    expect(status.periodEnds).toBeNull();
    expect(status.includedConversations).toBe(1);
    expect(status.conversationsUsed).toBe(0);
  });
});

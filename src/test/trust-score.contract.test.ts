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

    if (path === "/users/me/trust-score" && method === "GET") {
      if (overrides.unverifiedTrust) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              value: 3.5,
              label: "Good",
              percentile: 60,
              completedDatesCount: 0,
              isVerified: false,
              breakdown: { items: [], rules: [] },
              computedAt: "2026-10-23T19:30:00.000Z",
            },
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            value: 4.8,
            label: "Excellent",
            percentile: 95,
            completedDatesCount: 4,
            isVerified: true,
            breakdown: {
              items: [
                {
                  type: "VERIFIED",
                  title: "Profile verified",
                  points: 0.5,
                  originalPoints: 0.5,
                  createdAt: "2026-10-18T10:00:00.000Z",
                },
                {
                  type: "DATE_ATTENDED",
                  title: "4 dates attended",
                  points: 0.4,
                  originalPoints: 0.4,
                  createdAt: "2026-10-22T19:00:00.000Z",
                },
                {
                  type: "RATING",
                  title: "Date feedback (3 ratings)",
                  points: 0.9,
                  originalPoints: 0.9,
                  createdAt: "2026-10-23T04:00:00.000Z",
                },
              ],
              rules: [],
            },
            computedAt: "2026-10-23T19:30:00.000Z",
          },
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

describe("trust-score contract (Phase 25)", () => {
  it("maps GET /users/me/trust-score to Trust card data and breakdown", async () => {
    const { account } = await load();
    const trust = await account.getTrust();

    expect(trust.title).toBe("4.8 Trust Score");
    expect(trust.verification).toBe("Verified");
    expect(trust.dates).toBe("4 confirmed");
    expect(trust.feedback).toBe("Date feedback (3 ratings)");

    const history = await account.getTrustHistory();
    expect(history).toHaveLength(3);
    // Newest first (2026-10-23 before 2026-10-22 before 2026-10-18)
    expect(history[0].label).toBe("Date feedback (3 ratings)");
    expect(history[0].value).toContain("+0.9");
    expect(history[1].label).toBe("4 dates attended");
    expect(history[1].value).toContain("+0.4");
    expect(history[2].label).toBe("Profile verified");
    expect(history[2].value).toContain("+0.5");
  });

  it("handles unverified user with zero dates and no ratings gracefully", async () => {
    const { account } = await load({ unverifiedTrust: true });
    const trust = await account.getTrust();

    expect(trust.title).toBe("3.5 Trust Score");
    expect(trust.verification).toBe("Not verified");
    expect(trust.dates).toBe("0 confirmed");
    expect(trust.feedback).toBe("No ratings yet");

    const history = await account.getTrustHistory();
    expect(history).toHaveLength(0);
  });
});

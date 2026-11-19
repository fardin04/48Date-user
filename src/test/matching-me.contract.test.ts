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

  const { apiPortalService } = await import("@/lib/portal/api-portal-service");
  return { portal: apiPortalService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auto-matching status contract tests (Phase 36)", () => {
  it("reads auto-matching status and tips via GET /matching/me with Bearer auth", async () => {
    const { portal } = await load();
    const status = await portal.getAutoMatchingStatus();

    const getCall = calls.find((c) => c.method === "GET" && c.path === "/matching/me");
    expect(getCall).toBeDefined();
    expect(getCall?.auth).toBe("Bearer test-access-token");
    expect(status.status).toBe("RETRYING");
    expect(status.tips).toContain("FEW_PEOPLE_NEARBY");
    expect(status.tips).toContain("ADD_PHOTOS");
    expect(status.tips).toContain("GET_VERIFIED");
  });
});

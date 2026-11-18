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

    if (path === "/auth/methods" && method === "GET") {
      if (overrides.phoneOnly) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Linked sign-in methods fetched.",
            data: {
              phone: "+880****1000001",
              phoneVerified: true,
              google: null,
            },
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Linked sign-in methods fetched.",
          data: {
            phone: "+880****1000001",
            phoneVerified: true,
            google: {
              email: "jane.doe@gmail.com",
            },
          },
        }),
        { status: 200 }
      );
    }

    if (path === "/auth/logout" && method === "POST") {
      return new Response(
        JSON.stringify({
          success: true,
          data: { message: "Successfully logged out" },
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

describe("auth-methods contract (Phase 27)", () => {
  it("fetches sign-in methods mapping masked phone and google email", async () => {
    const { account } = await load();
    const methods = await account.getSignInMethods();

    expect(methods).toEqual({
      phone: "+880****1000001",
      google: "jane.doe@gmail.com",
    });
    const getCall = calls.find((c) => c.method === "GET" && c.path.includes("/auth/methods"));
    expect(getCall).toBeDefined();
  });

  it("handles unlinked google correctly", async () => {
    const { account } = await load({ phoneOnly: true });
    const methods = await account.getSignInMethods();

    expect(methods).toEqual({
      phone: "+880****1000001",
      google: null,
    });
  });
});

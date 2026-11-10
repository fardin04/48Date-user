import { describe, expect, it, vi } from "vitest";
import { parseEvent } from "./client";
import { endpoints } from "./endpoints";
import { ApiError } from "./errors";

describe("ApiError.fromBody", () => {
  it("reads the message at the top with field details", () => {
    const error = ApiError.fromBody(400, {
      success: false,
      message: "Validation failed",
      error: { code: "VALIDATION_FAILED", details: [{ field: "maxDistanceKm", message: "between 1 and 500" }] },
    });
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_FAILED", message: "Validation failed" });
    expect(error.fields).toEqual({ maxDistanceKm: "between 1 and 500" });
  });

  it("reads the message inside error, and tolerates object or string details", () => {
    const limited = ApiError.fromBody(429, { success: false, error: { code: "AI_SUGGESTIONS_LIMIT", message: "Daily limit", details: { upgradeAvailable: true } } });
    expect(limited).toMatchObject({ code: "AI_SUGGESTIONS_LIMIT", message: "Daily limit", fields: {} });
    expect(ApiError.fromBody(400, { success: false, error: { code: "X", details: ["platform must be IOS"] } }).fields).toEqual({});
  });

  it("reads the code from errorCode, code or a code-like error string, and a listed message", () => {
    expect(ApiError.fromBody(409, { success: false, message: "Already confirmed", statusCode: 409, errorCode: "DATE_ALREADY_CONFIRMED" })).toMatchObject({ code: "DATE_ALREADY_CONFIRMED", message: "Already confirmed" });
    expect(ApiError.fromBody(404, { statusCode: 404, code: "NO_SWIPE_TO_UNDO", message: "No recent swipe" }).code).toBe("NO_SWIPE_TO_UNDO");
    expect(ApiError.fromBody(404, { statusCode: 404, error: "RATING_NOT_FOUND", message: "Not rated yet" }).code).toBe("RATING_NOT_FOUND");
    expect(ApiError.fromBody(400, { statusCode: 400, error: "Bad Request", message: ["text must be shorter"] })).toMatchObject({ code: "HTTP_400", message: "text must be shorter" });
  });

  it("falls back for empty bodies", () => {
    expect(ApiError.fromBody(401, null).code).toBe("UNAUTHORIZED");
    expect(ApiError.fromBody(502, "oops").code).toBe("HTTP_502");
  });
});

describe("parseEvent (SSE)", () => {
  it("reads the event name and JSON data, ignoring comments", () => {
    expect(parseEvent(': ping\nevent: progress\ndata: {"status":"RUNNING","progressPercent":60}')).toEqual({
      event: "progress",
      data: { status: "RUNNING", progressPercent: 60 },
    });
  });

  it("defaults to message, joins data lines and keeps non-JSON text", () => {
    expect(parseEvent("data: hello\ndata: world")).toEqual({ event: "message", data: "hello\nworld" });
    expect(parseEvent(": keep-alive")).toBeNull();
  });

  it("delivers the last event when a stream closes without a blank line", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000/api/v1");
    vi.stubGlobal("window", globalThis);
    const events: string[] = [];
    const body = ['event: progress\ndata: {"status":"RUNNING"}', 'event: completed\ndata: {"status":"COMPLETED"}'].join("\n\n");
    vi.stubGlobal("fetch", async () => new Response(body));
    const { api } = await import("./client");
    await api.stream("/discovery/runs/r1/events", ({ event }) => {
      events.push(event);
    }, new AbortController().signal);
    expect(events).toEqual(["progress", "completed"]);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

describe("endpoints", () => {
  it("encodes path ids", () => {
    expect(endpoints.discovery.profile("a/b?c")).toBe("/discovery/profile/a%2Fb%3Fc");
    expect(endpoints.dates.postponeAction("d1", "r1", "accept")).toBe("/dates/d1/postpone-requests/r1/accept");
  });

  it("cannot be rewritten at runtime", () => {
    expect(Object.isFrozen(endpoints)).toBe(true);
    expect(Object.isFrozen(endpoints.auth)).toBe(true);
    expect(() => {
      (endpoints.auth as { logout: string }).logout = "/elsewhere";
    }).toThrow();
  });
});

describe("session refresh", () => {
  const BASE = "http://localhost:3000/api/v1";
  const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
  const fail = (status: number, code: string) => new Response(JSON.stringify({ success: false, error: { code, message: code } }), { status });

  async function setup(refreshAnswer: () => Response) {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
    vi.stubGlobal("window", globalThis);
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (input: string, init: RequestInit = {}) => {
      const path = new URL(input).pathname.replace("/api/v1", "");
      calls.push(`${init.method ?? "GET"} ${path}`);
      if (path === "/auth/refresh") return refreshAnswer();
      const auth = new Headers(init.headers).get("Authorization");
      return auth === "Bearer fresh-access" ? ok({ nickname: "liam_chen" }) : fail(401, "UNAUTHORIZED");
    });
    const { tokenStore } = await import("./tokens");
    tokenStore.set({ accessToken: "expired-access", refreshToken: "r1" });
    const { api } = await import("./client");
    return { api, tokenStore, calls, store };
  }

  it("refreshes once for an expired token and retries, even for many requests at once", async () => {
    const { api, calls, store } = await setup(() => ok({ accessToken: "fresh-access", refreshToken: "r2" }));
    const results = await Promise.all([api.get("/users/me"), api.get("/users/me"), api.get("/matches")]);
    expect(results.every((r) => (r.data as { nickname: string }).nickname === "liam_chen")).toBe(true);
    expect(calls.filter((c) => c === "POST /auth/refresh")).toHaveLength(1);
    expect(store.get("48date.auth.refresh")).toBe("r2");
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("keeps the session when the refresh fails on the server's side (5xx)", async () => {
    const { api, tokenStore } = await setup(() => fail(502, "BAD_GATEWAY"));
    await expect(api.get("/users/me")).rejects.toMatchObject({ status: 401 });
    expect(tokenStore.refresh()).toBe("r1");
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("signs out when the API rejects the refresh token", async () => {
    const { api, tokenStore } = await setup(() => fail(401, "REFRESH_TOKEN_REUSED"));
    await expect(api.get("/users/me")).rejects.toMatchObject({ status: 401 });
    expect(tokenStore.refresh()).toBeNull();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

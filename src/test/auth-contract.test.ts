import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:3000/api/v1";

function mockFetchResponse(status: number, body: unknown) {
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

async function loadAuth() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  return (await import("@/lib/auth/api-auth-service")).apiAuthService;
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auth API mapping and error handling", () => {
  it("maps rate limits (429 HTTP status) to 'limited'", async () => {
    mockFetchResponse(429, { error: "TOO_MANY_REQUESTS", message: "Too many requests. Please wait." });
    const auth = await loadAuth();
    expect(await auth.sendCode({ dial: "+880", national: "1811000001" })).toBe("limited");
  });

  it("maps OTP_COOLDOWN code to 'limited'", async () => {
    mockFetchResponse(400, { error: { code: "OTP_COOLDOWN", message: "Please wait 60s before requesting another code." } });
    const auth = await loadAuth();
    expect(await auth.sendCode({ dial: "+880", national: "1811000001" })).toBe("limited");
  });

  it("maps OTP_INVALID code to 'mismatch'", async () => {
    mockFetchResponse(400, { error: { code: "OTP_INVALID", message: "Code does not match." } });
    const auth = await loadAuth();
    expect(await auth.verifyCode({ dial: "+880", national: "1811000001" }, "999999")).toBe("mismatch");
  });

  it("maps OTP_EXPIRED_OR_INVALID to 'expired'", async () => {
    mockFetchResponse(400, { error: { code: "OTP_EXPIRED_OR_INVALID", message: "Code has expired." } });
    const auth = await loadAuth();
    expect(await auth.verifyCode({ dial: "+880", national: "1811000001" }, "123456")).toBe("expired");
  });

  it("maps OTP_TOO_MANY_ATTEMPTS to 'expired'", async () => {
    mockFetchResponse(400, { error: { code: "OTP_TOO_MANY_ATTEMPTS", message: "Too many invalid attempts." } });
    const auth = await loadAuth();
    expect(await auth.verifyCode({ dial: "+880", national: "1811000001" }, "123456")).toBe("expired");
  });

  it("maps ACCOUNT_BANNED to 'banned'", async () => {
    mockFetchResponse(403, { error: { code: "ACCOUNT_BANNED", message: "Account has been suspended." } });
    const auth = await loadAuth();
    expect(await auth.verifyCode({ dial: "+880", national: "1811000001" }, "123456")).toBe("banned");
  });

  it("maps unexpected server errors to 'failed'", async () => {
    mockFetchResponse(500, { error: "INTERNAL_ERROR", message: "Server error" });
    const auth = await loadAuth();
    expect(await auth.sendCode({ dial: "+880", national: "1811000001" })).toBe("failed");
  });
});

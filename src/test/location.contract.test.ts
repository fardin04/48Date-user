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

    if (path === "/users/me/location" && method === "PATCH") {
      if (overrides.locationError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "LOCATION_UPDATE_FAILED",
              message: "Unable to update location",
            },
          }),
          { status: 400 }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            city: body.city,
            latitude: body.latitude,
            longitude: body.longitude,
          },
        }),
        { status: 200 }
      );
    }

    return replay(input, init);
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

describe("PATCH /users/me/location contract (Phase 28)", () => {
  it("sends manual area choice with rounded coordinates and clears region", async () => {
    const { apiAccountService } = await load();
    const areaName = await apiAccountService.saveLocation({
      kind: "area",
      area: {
        id: "dhanmondi",
        name: "Dhanmondi",
        region: "Dhaka",
        countryCode: "BD",
        label: "Dhanmondi, Dhaka",
        center: [23.746123, 90.374245],
      },
    });

    expect(areaName).toBe("Dhanmondi");
    const patchCall = calls.find((c) => c.path === "/users/me/location" && c.method === "PATCH");
    expect(patchCall).toBeDefined();
    expect(patchCall?.body).toEqual({
      latitude: 23.75,
      longitude: 90.37,
      city: "Dhanmondi",
      region: null,
      countryCode: "BD",
      source: "MANUAL",
    });
  });

  it("sends GPS device choice with approximate coordinates and source GPS", async () => {
    const { apiAccountService } = await load();
    const areaName = await apiAccountService.saveLocation({
      kind: "device",
      latitude: 23.792512,
      longitude: 90.407845,
    });

    expect(areaName).toBeDefined();
    const patchCall = calls.find((c) => c.path === "/users/me/location" && c.method === "PATCH");
    expect(patchCall).toBeDefined();
    expect(patchCall?.body.source).toBe("GPS");
    expect(patchCall?.body.permission).toBe("WHILE_IN_USE");
    expect(patchCall?.body.region).toBeNull();
  });

  it("throws friendly error on 400 failure", async () => {
    const { apiAccountService } = await load({ locationError: true });
    await expect(
      apiAccountService.saveLocation({
        kind: "area",
        area: {
          id: "banani",
          name: "Banani",
          region: "Dhaka",
          countryCode: "BD",
          label: "Banani, Dhaka",
          center: [23.79, 90.41],
        },
      })
    ).rejects.toThrow("Unable to update location");
  });
});

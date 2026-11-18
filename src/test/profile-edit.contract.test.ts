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

    if (path === "/users/me/profile" && method === "PATCH") {
      if (overrides.validationError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Validation failed",
              details: [{ field: "bio", message: "Bio is too short" }],
            },
          }),
          { status: 400 }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            nickname: "omar_farooq",
            bio: body.bio,
            occupation: body.occupation,
            lookingFor: body.lookingFor,
          },
        }),
        { status: 200 }
      );
    }

    if (path === "/users/me/photos" && method === "PUT") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            photos: body.photos.map((p: { fileId: string; isMain: boolean }, index: number) => ({
              id: `p_${index}`,
              fileId: p.fileId,
              url: `https://r2.48date.com/${p.fileId}.jpg`,
              position: index,
              isMain: p.isMain,
            })),
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

describe("profile-edit contract (Phase 26)", () => {
  it("updates profile via PATCH /users/me/profile with allowed fields only", async () => {
    const { account } = await load();
    const result = await account.saveProfile({
      nickname: "omar_farooq",
      occupation: "Lead Engineer",
      education: "Master's degree",
      lookingFor: "A real relationship",
      bio: "Updated bio for testing Phase 26.",
      interests: ["Coffee", "Running"],
    });

    expect(result.ok).toBe(true);
    const patchCall = calls.find((c) => c.method === "PATCH" && c.path.includes("/users/me/profile"));
    expect(patchCall).toBeDefined();
    expect(patchCall?.body).toEqual({
      bio: "Updated bio for testing Phase 26.",
      occupation: "Lead Engineer",
      lookingFor: "A real relationship",
    });
    // Ensure read-only fields are NOT sent in PATCH body
    expect(patchCall?.body).not.toHaveProperty("nickname");
    expect(patchCall?.body).not.toHaveProperty("education");
    expect(patchCall?.body).not.toHaveProperty("interests");
  });

  it("handles 400 validation error from API gracefully by returning field errors", async () => {
    const { account } = await load({ validationError: true });
    const result = await account.saveProfile({
      nickname: "omar_farooq",
      occupation: "Lead Engineer",
      education: "Master's degree",
      lookingFor: "A real relationship",
      bio: "Short",
      interests: ["Coffee"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.bio).toBe("Bio is too short");
    }
  });

  it("updates photos via PUT /users/me/photos setting isMain on first photo", async () => {
    const { account } = await load();
    await account.savePhotos([
      { fileId: "file_alpha", url: "https://r2.48date.com/alpha.jpg" },
      { fileId: "file_beta", url: "https://r2.48date.com/beta.jpg" },
    ]);

    const putCall = calls.find((c) => c.method === "PUT" && c.path.includes("/users/me/photos"));
    expect(putCall).toBeDefined();
    expect(putCall?.body).toEqual({
      photos: [
        { fileId: "file_alpha", isMain: true },
        { fileId: "file_beta", isMain: false },
      ],
    });
  });
});

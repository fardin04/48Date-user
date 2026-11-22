import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRoutes, replayFetch, type Call } from "./postman-replay";

/**
 * The backend answers of 2026-11-20 / 21 (`postman/Frontend-guideline.md`, B1–B9 and the follow-up
 * fixes) against `postman/48Date-Backend.postman_collection.json` of 2026-11-21.
 */
const BASE = "http://localhost:3000/api/v1";
let calls: Call[];

type Failure = { status: number; body: unknown };

/** Replays the collection; `fail` answers a `METHOD /path` with an error, `overrides` with a 200 body. */
async function load({ overrides = {}, fail = {} }: { overrides?: Record<string, unknown>; fail?: Record<string, Failure> } = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const local = new Map<string, string>();
  const storage = {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => void local.set(key, value),
    removeItem: (key: string) => void local.delete(key),
    clear: () => local.clear(),
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
  const replay = replayFetch(BASE, overrides);
  calls = replay.calls;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const response = await replay.fetchStub(input, init);
    const { method, path } = calls.at(-1)!;
    const failure = fail[`${method} ${path}`];
    return failure ? new Response(JSON.stringify(failure.body), { status: failure.status }) : response;
  });
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return { storage };
}

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock("@/lib/api/socket");
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const phone = { dial: "+880", national: "1811000001" };
const cooldown = (seconds?: number): Failure => ({
  status: 429,
  body: {
    success: false,
    message: "Please wait 42 seconds before requesting another code.",
    error: { code: "OTP_COOLDOWN", ...(seconds === undefined ? {} : { details: { retryAfterSeconds: seconds } }) },
  },
});

describe("B7: OTP cooldown seconds", () => {
  it("keeps error.details and reads retryAfterSeconds from it", async () => {
    const { ApiError } = await import("@/lib/api/errors");
    const error = ApiError.fromBody(429, cooldown(42).body);
    expect(error).toMatchObject({ code: "OTP_COOLDOWN", message: "Please wait 42 seconds before requesting another code.", retryAfterSeconds: 42 });
    expect(ApiError.fromBody(400, { success: false, message: "Validation failed.", error: { code: "VALIDATION_FAILED", details: [{ message: "phone is required" }] } }).retryAfterSeconds).toBeNull();
  });

  it("counts down from the API's seconds after a refused code request, and forgets it once a code is sent", async () => {
    vi.useFakeTimers({ now: Date.parse("2026-11-22T10:00:00.000Z"), toFake: ["Date"] });
    await load({ fail: { "POST /auth/phone/request-otp": cooldown(42) } });
    const { apiAuthService } = await import("@/lib/auth/api-auth-service");
    expect(await apiAuthService.sendCode(phone)).toBe("limited");
    expect(apiAuthService.codeRetryAt()).toBe(Date.parse("2026-11-22T10:00:42.000Z"));
    vi.unstubAllGlobals();
    await load();
    const fresh = (await import("@/lib/auth/api-auth-service")).apiAuthService;
    expect(await fresh.sendCode(phone)).toBe("sent");
    expect(fresh.codeRetryAt()).toBeNull();
  });

  it("has no countdown when the 429 carries no seconds", async () => {
    await load({ fail: { "POST /auth/phone/request-otp": cooldown() } });
    const { apiAuthService } = await import("@/lib/auth/api-auth-service");
    expect(await apiAuthService.resendCode(phone)).toBe("limited");
    expect(apiAuthService.codeRetryAt()).toBeNull();
  });
});

describe("B2 / B8 and Postman corrections: stories", () => {
  it("sizes the story photo from imageWidth / imageHeight, and measures it when they are null", async () => {
    const feed = (imageWidth: number | null, imageHeight: number | null) => {
      const example = JSON.parse(loadRoutes().find((route) => route.method === "GET" && route.pattern.test("/success-stories"))!.body);
      return { ...example, data: example.data.map((story: object) => ({ ...story, imageWidth, imageHeight })) };
    };
    await load({ overrides: { "GET /success-stories": feed(1080, 1350) } });
    let service = (await import("@/lib/portal/api-story-service")).apiStoryService;
    expect((await service.getStoryPage()).stories[0].photoSize).toEqual({ width: 1080, height: 1350 });
    await load({ overrides: { "GET /success-stories": feed(null, null) } });
    service = (await import("@/lib/portal/api-story-service")).apiStoryService;
    expect((await service.getStoryPage()).stories[0].photoSize).toBeUndefined();
  });

  it("likes with POST and unlikes with DELETE, reading likesCount from both", async () => {
    await load();
    const { apiStoryService } = await import("@/lib/portal/api-story-service");
    const liked = await apiStoryService.toggleLike("story-1", false);
    const unliked = await apiStoryService.toggleLike("story-1", true);
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(["POST /success-stories/story-1/like", "DELETE /success-stories/story-1/like"]);
    expect(Number.isInteger(liked.count) && Number.isInteger(unliked.count)).toBe(true);
    expect(unliked.liked).toBe(false);
  });
});

describe("onboarding after the follow-up fixes", () => {
  it("skips an optional step with `skip`, not `skipped`", async () => {
    const { stepCalls } = await import("@/lib/onboarding/step-payloads");
    const draft = { fields: {}, interests: [] } as never;
    expect(stepCalls("notify", { draft })).toEqual([{ step: "notifications", body: { skip: true } }]);
  });

  it("treats 409 ONBOARDING_COMPLETED as finished setup: nothing to save, the member moves on", async () => {
    const completed: Failure = { status: 409, body: { success: false, message: "Onboarding is already complete.", error: { code: "ONBOARDING_COMPLETED" } } };
    const fail = Object.fromEntries(["nickname", "real_name", "birthday", "location"].map((step) => [`PUT /onboarding/steps/${step}`, completed]));
    await load({ fail });
    const { apiOnboardingService } = await import("@/lib/onboarding/api-onboarding-service");
    const { setupStatus } = await import("@/lib/auth/setup-status");
    const draft = { fields: { nickname: "GoldenHour", firstName: "Ana", lastName: "Lee", dob: "1998-01-01", occupation: "Designer" }, interests: [] } as never;
    expect(await apiOnboardingService.saveStep("birthday", { draft })).toEqual({ ok: true });
    expect(setupStatus.read()).toBe("portal");
  });
});

describe("link phone: an existing phone is never replaced", () => {
  it("shows the API's message for 409 PHONE_ALREADY_SET and re-reads the sign-in methods", async () => {
    const message = "Your account already has a phone number.";
    await load({ fail: { "POST /auth/link/phone/request-otp": { status: 409, body: { success: false, message, error: { code: "PHONE_ALREADY_SET" } } } } });
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    await apiAccountService.getSignInMethods();
    await expect(apiAccountService.sendLinkCode("+8801811000099")).rejects.toMatchObject({ code: "PHONE_ALREADY_SET", message });
    await apiAccountService.getSignInMethods();
    expect(calls.filter(({ method, path }) => method === "GET" && path === "/auth/methods")).toHaveLength(2);
  });
});

describe("photo gallery (User / 02 - Users / 39–45)", () => {
  /** Answers `POST /files/batch` with the collection's example and records the form fields. */
  function fakeBatchXhr(sent: Record<string, string[]>[]) {
    const example = loadRoutes().find((route) => route.method === "POST" && route.pattern.test("/files/batch"))!;
    return class {
      status = 0;
      responseText = "";
      upload = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      url = "";
      open(_method: string, url: string) {
        this.url = url;
      }
      setRequestHeader() {}
      abort() {}
      send(form: FormData) {
        const fields: Record<string, string[]> = { url: [this.url] };
        for (const [key, value] of form.entries()) (fields[key] ??= []).push(typeof value === "string" ? value : "<file>");
        sent.push(fields);
        queueMicrotask(() => {
          this.status = example.status;
          this.responseText = example.body;
          this.onload?.();
        });
      }
    };
  }

  it("lists the gallery main first with each photo's id", async () => {
    await load();
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    const photos = await apiAccountService.getPhotos();
    expect(photos[0]).toMatchObject({ id: "photo-uuid-1", fileId: "file-uuid-1" });
    expect(calls.at(-1)).toMatchObject({ method: "GET", path: "/users/me/photos", auth: "Bearer test-access" });
  });

  it("saves the difference: uploads new files in one batch, attaches them, moves main, then deletes", async () => {
    await load();
    const sent: Record<string, string[]>[] = [];
    vi.stubGlobal("XMLHttpRequest", fakeBatchXhr(sent));
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    const file = new File([new Uint8Array([1, 2, 3])], "new.jpg", { type: "image/jpeg" });
    // The gallery holds photo-uuid-1 (main) and photo-uuid-2: keep 2 as the new main, drop 1, add a file.
    await apiAccountService.savePhotos([{ id: "photo-uuid-2", fileId: "file-uuid-2", url: "https://cdn.48date.local/p2.webp" }, { url: "blob:new", file }]);
    expect(sent).toEqual([{ url: [`${BASE}/files/batch`], purpose: ["PROFILE_PHOTO"], files: ["<file>"] }]);
    const writes = calls.filter(({ method }) => method !== "GET").map(({ method, path, body }) => ({ method, path, body }));
    expect(writes).toEqual([
      { method: "POST", path: "/users/me/photos", body: { photos: [{ fileId: "3f54817a-c322-482f-8da7-111111111111", isMain: false }] } },
      { method: "PATCH", path: "/users/me/photos/photo-uuid-2/main", body: null },
      { method: "DELETE", path: "/users/me/photos", body: { photoIds: ["photo-uuid-1"] } },
    ]);
  });

  it("sends nothing but the read when the gallery is unchanged", async () => {
    await load();
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    await apiAccountService.savePhotos([
      { id: "photo-uuid-1", url: "https://cdn.48date.local/p1.webp" },
      { id: "photo-uuid-2", url: "https://cdn.48date.local/p2.webp" },
    ]);
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(["GET /users/me/photos"]);
  });

  it("shows the API's message when the main photo can't be deleted, and keeps the screen's choices", async () => {
    const message = "Choose another main photo first before deleting your current main photo.";
    await load({ fail: { "DELETE /users/me/photos": { status: 409, body: { success: false, message, error: { code: "MAIN_PHOTO_DELETE_FORBIDDEN" } } } } });
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    await expect(apiAccountService.savePhotos([{ id: "photo-uuid-2", url: "https://cdn.48date.local/p2.webp" }])).rejects.toThrow(message);
  });
});

describe("dates: viewer-relative fields instead of internal ids", () => {
  const plan = (requestedByMe: boolean) => ({
    success: true,
    data: [
      {
        id: "d1",
        matchId: "m1",
        proposedByMe: true,
        counterpart: { availability: "ACTIVE", nickname: "GoldenHour", age: 26, mainPhotoUrl: null, isVerified: true },
        venueName: "Cafe Mango",
        venueCategory: "Cafe",
        venueAddress: "Road 11, Gulshan 1, Dhaka",
        venueLatitude: 23.79,
        venueLongitude: 90.41,
        venueRating: null,
        venuePhotoRef: null,
        distanceKmFromMe: null,
        scheduledAt: "2026-12-01T14:00:00.000Z",
        timeZone: "Asia/Dhaka",
        status: "SET",
        cancelReason: null,
        cancelledByMe: null,
        cancelNote: null,
        pendingPostponeRequest: {
          id: "r1",
          datePlanId: "d1",
          type: "POSTPONE",
          requestedByMe,
          reason: "Later?",
          oldScheduledAt: "2026-12-01T14:00:00.000Z",
          newScheduledAt: "2026-12-01T16:00:00.000Z",
          status: "PENDING",
          respondedByMe: null,
          respondedAt: null,
          createdAt: "2026-11-22T09:00:00.000Z",
        },
        canAccept: false,
        canDecline: false,
        canWithdraw: false,
        canCancel: true,
        canPostpone: false,
        canRate: false,
        hasRated: false,
        createdAt: "2026-11-20T09:00:00.000Z",
        updatedAt: "2026-11-22T09:00:00.000Z",
      },
    ],
    meta: { nextCursor: null, hasMore: false },
  });

  it("tells a postpone request of ours from the partner's by requestedByMe", async () => {
    await load({ overrides: { "GET /dates": plan(true) } });
    let dates = (await import("@/lib/portal/api-date-service")).apiDateService;
    expect((await dates.getPlan("GoldenHour")).postpone).toMatchObject({ mine: true });
    await load({ overrides: { "GET /dates": plan(false) } });
    dates = (await import("@/lib/portal/api-date-service")).apiDateService;
    expect((await dates.getPlan("GoldenHour")).postpone).toMatchObject({ mine: false });
  });

  it("shows no stars for a custom venue (venueRating null)", async () => {
    await load({ overrides: { "GET /dates": plan(true) } });
    const { apiDateService } = await import("@/lib/portal/api-date-service");
    const { place } = await apiDateService.getPlan("GoldenHour");
    expect(place.highlight).toBe("");
  });
});

describe("live events over the socket", () => {
  /** A socket that records handlers; `fire` plays a server event. */
  function fakeSocket() {
    const handlers = new Map<string, Set<(payload?: unknown) => void>>();
    const socket = {
      connected: false,
      on: (event: string, handler: (payload?: unknown) => void) => void (handlers.get(event) ?? handlers.set(event, new Set()).get(event)!).add(handler),
      off: (event: string, handler: (payload?: unknown) => void) => void handlers.get(event)?.delete(handler),
      emit: () => undefined,
    };
    const fire = (event: string, payload?: unknown) => handlers.get(event)?.forEach((handler) => handler(payload));
    const release = vi.fn();
    vi.doMock("@/lib/api/socket", () => ({ acquireSocket: () => ({ socket, release }) }));
    return { fire, release, listening: (event: string) => (handlers.get(event)?.size ?? 0) > 0 };
  }

  const stale = async (key: readonly string[]) => {
    const client = (await import("@/lib/api/query-client")).getQueryClient();
    return client.getQueryCache().findAll({ queryKey: [...key] }).every((query) => query.state.isInvalidated);
  };

  it("notification:new refreshes the bell's unread count and the inbox", async () => {
    await load();
    const live = fakeSocket();
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    await apiAccountService.getUnreadCount();
    const stop = apiAccountService.watchNotifications();
    expect(await stale(["notifications"])).toBe(false);
    live.fire("notification:new", { id: "n1", type: "NEW_MATCH" });
    expect(await stale(["notifications"])).toBe(true);
    stop();
    expect(live.listening("notification:new")).toBe(false);
    expect(live.release).toHaveBeenCalledOnce();
  });

  it("conversation:reopened brings an unblocked chat back: list, matches, dates and blocks re-read", async () => {
    await load();
    const live = fakeSocket();
    const { apiChatService } = await import("@/lib/portal/api-chat-service");
    const { matchesApi } = await import("@/lib/api/modules/matches-api");
    await matchesApi.list("all");
    const stop = apiChatService.watchInbox();
    live.fire("conversation:reopened", { conversationId: "019283aa-0000-7000-8000-000000000099" });
    expect(await stale(["matches"])).toBe(true);
    stop();
    expect(live.listening("conversation:reopened")).toBe(false);
  });
});

describe("QA X8: a 401 that isn't an expired session is not retried", () => {
  const otpInvalid: Failure = { status: 401, body: { success: false, message: "The code you entered is incorrect.", error: { code: "OTP_INVALID" } } };

  it("shows a wrong link-phone code at once, without a refresh or a second attempt", async () => {
    await load({ fail: { "POST /auth/link/phone/verify": otpInvalid } });
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    await expect(apiAccountService.linkPhone("+8801811000099", "123456")).rejects.toMatchObject({ code: "OTP_INVALID" });
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(["POST /auth/link/phone/verify"]);
  });

  it("still refreshes once and retries on 401 UNAUTHORIZED", async () => {
    let first = true;
    await load();
    const replayed = globalThis.fetch;
    vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
      const response = await replayed(input, init);
      if (first && String(input).endsWith("/auth/methods")) {
        first = false;
        return new Response(JSON.stringify({ success: false, message: "Your session has expired. Please sign in again.", error: { code: "UNAUTHORIZED" } }), { status: 401 });
      }
      return response;
    });
    const { apiAccountService } = await import("@/lib/portal/api-account-service");
    await apiAccountService.getSignInMethods();
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(["GET /auth/methods", "POST /auth/refresh", "GET /auth/methods"]);
  });
});

describe("QA X9: a refused Google sign-in keeps the API's reason", () => {
  it("returns the 401's own message for GOOGLE-ERROR, and keeps it for this tab", async () => {
    const message = "Your Google email address is not verified.";
    await load({ fail: { "POST /auth/google": { status: 401, body: { success: false, message, error: { code: "GOOGLE_EMAIL_UNVERIFIED" } } } } });
    const { apiAuthService } = await import("@/lib/auth/api-auth-service");
    const { googleError } = await import("@/lib/auth/google-error");
    const result = await apiAuthService.signInWithGoogle("google-id-token");
    expect(result).toEqual({ status: "failed", message });
    googleError.write("message" in result ? (result.message ?? null) : null);
    expect(googleError.snapshot()).toBe(message);
    googleError.write(null);
    expect(googleError.snapshot()).toBeNull();
  });
});

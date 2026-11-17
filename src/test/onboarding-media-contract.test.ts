import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRoutes, replayFetch, type Call } from "./postman-replay";

/**
 * Phase 6 contract: the central upload (`POST /files`, multipart over XHR for progress), the photos
 * step, starting a selfie review (`POST /verification`) and reading its snapshot, against the
 * example responses of `postman/48Date-Backend.postman_collection.json`.
 */
const BASE = "http://localhost:3000/api/v1";

type Sent = { method: string; url: string; headers: Record<string, string>; fields: Record<string, unknown> };
let calls: Call[];
let uploads: Sent[];

/** A fake XMLHttpRequest that answers `POST /files` with the collection's example (or the given status / body). */
function fakeXhr(status?: number, body?: unknown) {
  const example = loadRoutes().find((route) => route.method === "POST" && route.pattern.test("/files"))!;
  return class FakeXhr {
    status = 0;
    responseText = "";
    upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    private sent: Sent = { method: "", url: "", headers: {}, fields: {} };
    open(method: string, url: string) {
      this.sent.method = method;
      this.sent.url = url;
    }
    setRequestHeader(name: string, value: string) {
      this.sent.headers[name] = value;
    }
    abort() {
      this.onabort?.();
    }
    send(form: FormData) {
      for (const [key, value] of form.entries()) this.sent.fields[key] = typeof value === "string" ? value : "<file>";
      uploads.push(this.sent);
      queueMicrotask(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
        this.status = status ?? example.status;
        this.responseText = body === undefined ? example.body : JSON.stringify(body);
        this.onload?.();
      });
    }
  };
}

async function load(xhr = fakeXhr(), overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k), key: () => null, length: 0 });
  uploads = [];
  vi.stubGlobal("XMLHttpRequest", xhr);
  const replay = replayFetch(BASE, overrides);
  calls = replay.calls;
  vi.stubGlobal("fetch", replay.fetchStub);
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return { onboarding: (await import("@/lib/onboarding/api-onboarding-service")).apiOnboardingService, store };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const photo = () => new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });
const ATTEMPT = "4a65928b-d433-493f-9eb8-1f73e57f8023";

describe("POST /files (central upload)", () => {
  it("uploads a profile photo with its purpose and the bearer token, reporting progress, and returns the file id", async () => {
    const { onboarding } = await load();
    const progress: number[] = [];
    const result = await onboarding.uploadPhoto(photo(), (percent) => progress.push(percent), new AbortController().signal);
    expect(result).toEqual({ status: "uploaded", fileId: "3f54817a-c322-482f-8da7-0e62d46e7f12" });
    expect(uploads[0]).toMatchObject({ method: "POST", url: `${BASE}/files`, headers: { Authorization: "Bearer test-access" }, fields: { file: "<file>", purpose: "PROFILE_PHOTO" } });
    // Below 100 while sending, then 100 once the server confirmed.
    expect(progress).toEqual([50, 100]);
  });

  it("reports a refused upload as failed (PHOTO-ERROR), never as uploaded", async () => {
    const { onboarding } = await load(fakeXhr(413, { success: false, message: "File too large.", error: { code: "PAYLOAD_TOO_LARGE" } }));
    expect(await onboarding.uploadPhoto(photo(), () => undefined, new AbortController().signal)).toEqual({ status: "failed" });
  });
});

describe("PUT /onboarding/steps/photos", () => {
  it("sends the uploaded files with the first one as main, leaving out photos that never uploaded", async () => {
    // Every required step before photos is saved, as for a member reaching PHOTOS.
    const order = ["location", "nickname", "real_name", "birthday", "smoking", "drinking", "gender", "kids", "interested_in", "interests", "height", "weight", "looking_for", "languages", "photos", "selfie", "notifications"];
    const steps = order.map((step) => ({ step, name: step, required: !["location", "selfie", "notifications"].includes(step), state: order.indexOf(step) < order.indexOf("photos") ? "DONE" : "PENDING" }));
    const { onboarding } = await load(fakeXhr(), { "GET /onboarding": { success: true, data: { onboardingStatus: "IN_PROGRESS", nextStep: "photos", progressPercent: 85, steps, savedValues: {} } } });
    const draft = { fields: {}, interests: [] };
    const photos = [
      { id: "a", url: "blob:a", fileId: "file-main" },
      { id: "b", url: "blob:b" },
      { id: "c", url: "blob:c", fileId: "file-2" },
    ];
    await onboarding.saveStep("photos", { draft, photos });
    const put = calls.find((call) => call.method === "PUT" && call.path === "/onboarding/steps/photos");
    expect(put?.body).toEqual({ photos: [{ fileId: "file-main", isMain: true }, { fileId: "file-2", isMain: false }] });
  });
});

describe("READY: POST /matching/runs", () => {
  it("starts one auto-matching run; a second start joins it instead of queuing another", async () => {
    const { onboarding } = await load();
    onboarding.startMatching();
    onboarding.startMatching();
    await vi.waitFor(() => expect(calls.filter((call) => call.method === "POST" && call.path === "/matching/runs")).toHaveLength(1));
    // The run is then followed live (SSE) until it ends.
    await vi.waitFor(() => expect(calls.some((call) => call.path === "/matching/runs/01928374-aaaa-bbbb-cccc-000000000002/events")).toBe(true));
    expect(calls.filter((call) => call.method === "POST" && call.path === "/matching/runs")).toHaveLength(1);
  });
});

describe("POST /verification and the snapshot", () => {
  it("uploads the selfie as VERIFICATION_SELFIE, starts the review with its file id and remembers the attempt", async () => {
    const { onboarding, store } = await load();
    const result = await onboarding.submitSelfie(new Blob([new Uint8Array([9])], { type: "image/jpeg" }));
    expect(uploads[0].fields.purpose).toBe("VERIFICATION_SELFIE");
    expect(calls.find((call) => call.method === "POST" && call.path === "/verification")?.body).toEqual({ selfieFileId: "3f54817a-c322-482f-8da7-0e62d46e7f12" });
    // QUEUED is still in review.
    expect(result).toEqual({ status: "pending" });
    expect([...store.values()]).toContain(ATTEMPT);
  });

  it("reads the remembered attempt's snapshot (PASSED) as verified", async () => {
    const { onboarding, store } = await load();
    store.set("48date.member.verification", ATTEMPT);
    expect(await onboarding.getVerification()).toEqual({ status: "verified" });
    expect(calls.some((call) => call.path === `/verification/${ATTEMPT}`)).toBe(true);
    expect(calls.some((call) => call.path === "/users/me")).toBe(true);
  });

  it("sends a selfie the upload refused back to VERIFY-RETRY without starting a review", async () => {
    const { onboarding } = await load(fakeXhr(400, { success: false, message: "Unsupported file.", error: { code: "BAD_REQUEST" } }));
    expect(await onboarding.submitSelfie(new Blob([new Uint8Array([9])], { type: "image/jpeg" }))).toEqual({ status: "retry" });
    expect(calls.some((call) => call.path === "/verification")).toBe(false);
  });
});

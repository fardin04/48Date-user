import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRoutes, replayFetch, type Call } from "./postman-replay";
import type { StoryDraft } from "@/lib/portal/story-service";

const BASE = "http://localhost:3000/api/v1";
let calls: Call[];
type Sent = { method: string; url: string; headers: Record<string, string>; fields: Record<string, unknown> };
let uploads: Sent[];

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
        this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
        this.status = status ?? example.status;
        this.responseText = body === undefined ? example.body : JSON.stringify(body);
        this.onload?.();
      });
    }
  };
}

async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  uploads = [];
  vi.stubGlobal("XMLHttpRequest", fakeXhr());
  const session = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => session.get(k) ?? null,
    setItem: (k: string, v: string) => void session.set(k, v),
    removeItem: (k: string) => void session.delete(k),
    clear: () => void session.clear(),
  });
  const replay = replayFetch(BASE, overrides);
  calls = replay.calls;
  vi.stubGlobal("fetch", replay.fetchStub);
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return (await import("@/lib/portal/api-story-service")).apiStoryService;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("story create, edit, delete and eligible dates contract (Phase 22)", () => {
  it("reads eligible completed dates for the 'When did you meet?' dropdown", async () => {
    const stories = await load();
    const options = await stories.getMeetOptions();
    expect(options).toHaveLength(1);
    expect(options[0]).toEqual({
      value: "date-plan-uuid-1",
      label: "18 Oct · Cafe Nero, Piccadilly with bob_m",
    });
    expect(calls.at(-1)?.path).toBe("/users/me/story-eligible-dates");
  });

  it("reads own pending submission with partner status note", async () => {
    const stories = await load();
    const submission = await stories.getSubmission();
    expect(submission).not.toBeNull();
    expect(submission).toMatchObject({
      title: "We fell in love at the coffee shop!",
      status: "pending",
      subStatus: "PENDING_PARTNER",
      statusBadge: "Waiting for partner",
      met: "date-plan-uuid-1",
    });
    expect(submission?.statusNote).toContain("partner needs to approve");
    expect(calls.at(-1)?.path).toBe("/users/me/success-stories");
  });

  it("creates a new story with uploaded photo and clears the local draft", async () => {
    let progressReceived = false;
    // When no submission exists yet initially
    const stories = await load({
      "GET /users/me/success-stories": {
        success: true,
        data: [],
      },
    });

    const draft: StoryDraft = {
      title: "Our exciting coffee date",
      met: "date-plan-uuid-1",
      body: "We met on a sunny afternoon and talked about everything.",
      consent: true,
    };
    await stories.saveDraft(draft);
    expect(await stories.getDraft()).toEqual(draft);

    const dummyFile = new File(["dummy-content"], "test.jpg", { type: "image/jpeg" });

    // Mock upload response and create response
    const created = await stories.submit(draft, dummyFile, (pct) => {
      if (pct > 0) progressReceived = true;
    });
    expect(created.status).toBe("pending");
    expect(progressReceived).toBe(true);

    // XHR upload call made to /files
    expect(uploads).toHaveLength(1);
    expect(uploads[0].url).toContain("/files");
    expect(uploads[0].fields.purpose).toBe("STORY_IMAGE");

    // Create call made with POST /success-stories
    const createCall = calls.find((c) => c.path === "/success-stories" && c.method === "POST");
    expect(createCall).toBeDefined();
    expect(createCall?.body).toMatchObject({
      title: "Our exciting coffee date",
      datePlanId: "date-plan-uuid-1",
    });

    // Draft is cleared after successful submit
    expect(await stories.getDraft()).toBeNull();
  });

  it("edits an existing story and sends PATCH /success-stories/:id", async () => {
    const stories = await load();
    const updatedDraft: StoryDraft = {
      title: "Updated: We fell in love at the coffee shop!",
      met: "date-plan-uuid-1",
      body: "Updated story body with more than twenty characters of text.",
      consent: true,
    };

    const result = await stories.submit(updatedDraft, null);
    expect(result).toBeDefined();

    const patchCall = calls.find((c) => c.method === "PATCH" && c.path === "/success-stories/story-uuid-1");
    expect(patchCall).toBeDefined();
    expect(patchCall?.body).toMatchObject({
      title: "Updated: We fell in love at the coffee shop!",
      body: "Updated story body with more than twenty characters of text.",
    });
  });

  it("removes a submission using DELETE /success-stories/:id", async () => {
    const stories = await load();
    await stories.removeSubmission();
    const deleteCall = calls.find((c) => c.method === "DELETE" && c.path === "/success-stories/story-uuid-1");
    expect(deleteCall).toBeDefined();
  });
});

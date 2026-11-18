import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockStoryService } from "@/lib/portal/mocks/mock-story-service";
import { getStoriesPage } from "@/stores/portal-store";
import type { StoryDraft } from "@/lib/portal/story-service";

describe("story-draft and validation (Phase 22)", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    });
  });

  it("saves and restores a story draft across reads", async () => {
    expect(await mockStoryService.getDraft()).toBeNull();
    const draft: StoryDraft = {
      title: "Our first meeting",
      met: "2026-06",
      body: "We met at the little café on a rainy afternoon.",
      consent: true,
    };
    await mockStoryService.saveDraft(draft);
    expect(await mockStoryService.getDraft()).toEqual(draft);
  });

  it("truncates fields exceeding limit on draft read", async () => {
    const limits = getStoriesPage().create.limits;
    const longTitle = "A".repeat(limits.title + 20);
    const longBody = "B".repeat(limits.body + 50);
    const draft: StoryDraft = {
      title: longTitle,
      met: "2026-06",
      body: longBody,
      consent: true,
    };
    await mockStoryService.saveDraft(draft);
    const read = await mockStoryService.getDraft();
    expect(read?.title.length).toBe(limits.title);
    expect(read?.body.length).toBe(limits.body);
  });

  it("keeps the draft when submission fails (e.g. offline)", async () => {
    const draft: StoryDraft = {
      title: "Connection drops",
      met: "2026-06",
      body: "This should stay saved in the draft storage.",
      consent: true,
    };
    await mockStoryService.saveDraft(draft);

    vi.stubGlobal("navigator", { onLine: false });
    await expect(mockStoryService.submit(draft, null)).rejects.toThrow();

    // Draft is still present
    const kept = await mockStoryService.getDraft();
    expect(kept).toEqual(draft);
    vi.unstubAllGlobals();
  });

  it("clears the draft upon successful submission", async () => {
    const draft: StoryDraft = {
      title: "Sweet sunset date",
      met: "2026-06",
      body: "We talked for three hours without noticing the time passing.",
      consent: true,
    };
    await mockStoryService.saveDraft(draft);
    expect(await mockStoryService.getDraft()).not.toBeNull();

    vi.stubGlobal("navigator", { onLine: true });
    const submission = await mockStoryService.submit(draft, null);
    expect(submission.title).toBe(draft.title);
    expect(submission.status).toBe("pending");

    // Draft is cleared after successful submit
    expect(await mockStoryService.getDraft()).toBeNull();
    vi.unstubAllGlobals();
  });

  it("validates limits: title max 80, body min 20, body max 1000", () => {
    const limits = getStoriesPage().create.limits;
    expect(limits.title).toBe(80);
    expect(limits.bodyMin).toBe(20);
    expect(limits.body).toBe(1000);
  });
});

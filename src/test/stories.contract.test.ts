import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Phase 20 / 21 contract: the feed with cursor paging, like / unlike (the unlike response says
 * `likeCount`), and comments GET (paged, own comments marked) / POST / DELETE, against
 * `postman/48Date-Backend.postman_collection.json`.
 */
const BASE = "http://localhost:3000/api/v1";
let calls: Call[];

async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
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

describe("stories feed", () => {
  it("reads a page and passes the cursor for the next one", async () => {
    const stories = await load({
      "GET /success-stories": { success: true, data: [], meta: { nextCursor: "cur-2", hasMore: true } },
    });
    expect(await stories.getStoryPage()).toEqual({ stories: [], next: "cur-2" });
    expect(calls.at(-1)?.path).toBe("/success-stories");
  });

  it("maps the collection's example story", async () => {
    const stories = await load();
    const { stories: page } = await stories.getStoryPage();
    expect(page[0]).toMatchObject({ id: "story-uuid-1", likes: { count: 24, liked: false } });
  });
});

describe("likes", () => {
  it("likes with POST and unlikes with DELETE, showing the server's count", async () => {
    const stories = await load();
    expect(await stories.toggleLike("story-uuid-1", false)).toEqual({ count: 25, liked: true });
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/success-stories/story-uuid-1/like" });
    expect(await stories.toggleLike("story-uuid-1", true)).toEqual({ count: 41, liked: false });
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", path: "/success-stories/story-uuid-1/like" });
  });
});

describe("comments", () => {
  it("reads a page, marks the member's own comments and pages on", async () => {
    const stories = await load({
      "GET /users/me": { success: true, data: { nickname: "Clara_D" } },
    });
    const page = await stories.getComments("story-uuid-1");
    expect(page.comments).toEqual([{ id: "comment-uuid-1", author: "clara_d", text: "Congratulations to both of you! Such an inspiring story.", mine: true }]);
    // The collection's example says hasMore: false.
    expect(page.next).toBeNull();
  });

  it("posts a comment and deletes one", async () => {
    const stories = await load();
    expect(await stories.addComment("story-uuid-1", "Lovely!")).toEqual({ author: "clara_d", text: "Congratulations to both of you! Such an inspiring story." });
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/success-stories/story-uuid-1/comments", body: { body: "Lovely!" } });
    await stories.deleteComment("story-uuid-1", "comment-uuid-1");
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", path: "/success-stories/story-uuid-1/comments/comment-uuid-1" });
  });
});

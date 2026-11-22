import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { CursorMeta } from "../types/envelope";
import type { ApiStory, ApiStoryComment, EligibleDate, StoryBody } from "../types/stories";
import { cacheKeys } from "./cache-keys";

const MINUTE = 60_000;
const PAGE = 20;
const commentKey = (id: string) => [...cacheKeys.stories, "raw", "comments", id];
const paged = <T>(result: { data: T; meta?: unknown }) => ({ data: result.data, meta: result.meta as CursorMeta | undefined });

/** User / 14 - Success Stories. */
export const storiesApi = {
  /** Approved stories, newest first: the page from `cursor` (the first without). */
  feed: (cursor?: string) =>
    cached([...cacheKeys.stories, "raw", "feed", cursor ?? ""], MINUTE, async () => paged(await api.get<ApiStory[]>(endpoints.stories.feed, { query: { limit: PAGE, cursor } }))),
  detail: (id: string) => cached([...cacheKeys.stories, "raw", "detail", id], MINUTE, () => api.get<ApiStory>(endpoints.stories.detail(id))),
  /** A story's comments, a page from `cursor` (the first without). */
  comments: (id: string, cursor?: string) =>
    cached([...commentKey(id), cursor ?? ""], MINUTE, async () => paged(await api.get<ApiStoryComment[]>(endpoints.stories.comments(id), { query: { limit: PAGE, cursor } }))),
  async addComment(id: string, body: string) {
    const result = await api.post<ApiStoryComment>(endpoints.stories.comments(id), { body: { body } });
    invalidate([...cacheKeys.stories, "raw", "detail", id], [...cacheKeys.stories, "detail", id], commentKey(id));
    return result;
  },
  async deleteComment(id: string, commentId: string) {
    const result = await api.delete<{ deleted: boolean; commentId: string }>(endpoints.stories.comment(id, commentId));
    invalidate([...cacheKeys.stories, "raw", "detail", id], [...cacheKeys.stories, "detail", id], commentKey(id));
    return result;
  },
  mine: (query?: { role?: "author" | "partner"; status?: string }) =>
    cached([...cacheKeys.myStories, "raw", query?.role ?? "", query?.status ?? ""], 30_000, () =>
      api.get<ApiStory[]>(endpoints.users.stories, { query })
    ),
  eligibleDates: () => cached([...cacheKeys.myStories, "raw", "eligible"], MINUTE, () => api.get<EligibleDate[]>(endpoints.users.storyEligibleDates)),
  async like(id: string) {
    const result = await api.post<{ isLiked: boolean; likesCount: number }>(endpoints.stories.like(id));
    invalidate([...cacheKeys.stories, "raw"]);
    return result;
  },
  /** Only removes a like (POST toggles); both answer `{ isLiked, likesCount }`. */
  async unlike(id: string) {
    const result = await api.delete<{ isLiked: boolean; likesCount: number }>(endpoints.stories.like(id));
    invalidate([...cacheKeys.stories, "raw"]);
    return result;
  },
  async respond(id: string, accept: boolean) {
    const result = await api.post<{ id: string; status: string }>(endpoints.stories.respond(id), { body: { accept } });
    invalidate(cacheKeys.stories, cacheKeys.myStories);
    return result;
  },
  async create(body: StoryBody) {
    const result = await api.post<ApiStory>(endpoints.stories.feed, { body });
    invalidate(cacheKeys.myStories);
    return result;
  },
  /** Any edit sends the story back for the partner's consent. */
  async edit(id: string, body: Partial<Omit<StoryBody, "datePlanId">>) {
    const result = await api.patch<Partial<ApiStory>>(endpoints.stories.detail(id), { body });
    invalidate(cacheKeys.myStories, cacheKeys.stories);
    return result;
  },
  async remove(id: string) {
    const result = await api.delete<{ deleted: boolean }>(endpoints.stories.detail(id));
    invalidate(cacheKeys.myStories, cacheKeys.stories);
    return result;
  },
};

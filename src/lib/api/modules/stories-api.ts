import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { ApiStory, ApiStoryComment, EligibleDate, StoryBody } from "../types/stories";
import { cacheKeys } from "./cache-keys";

const MINUTE = 60_000;

/** User / 14 - Success Stories. */
export const storiesApi = {
  /** Approved stories, newest first (first page). */
  feed: () => cached([...cacheKeys.stories, "raw", "feed"], MINUTE, () => api.get<ApiStory[]>(endpoints.stories.feed, { query: { limit: 20 } })),
  detail: (id: string) => cached([...cacheKeys.stories, "raw", "detail", id], MINUTE, () => api.get<ApiStory>(endpoints.stories.detail(id))),
  comments: (id: string) => api.get<ApiStoryComment[]>(endpoints.stories.comments(id), { query: { limit: 50 } }),
  async addComment(id: string, body: string) {
    const result = await api.post<ApiStoryComment>(endpoints.stories.comments(id), { body: { body } });
    invalidate([...cacheKeys.stories, "raw", "detail", id], [...cacheKeys.stories, "detail", id]);
    return result;
  },
  mine: () => cached([...cacheKeys.myStories, "raw"], 30_000, () => api.get<ApiStory[]>(endpoints.users.stories)),
  eligibleDates: () => cached([...cacheKeys.myStories, "raw", "eligible"], MINUTE, () => api.get<EligibleDate[]>(endpoints.users.storyEligibleDates)),
  async like(id: string) {
    const result = await api.post<{ isLiked: boolean; likesCount: number }>(endpoints.stories.like(id));
    invalidate([...cacheKeys.stories, "raw"]);
    return result;
  },
  async respond(id: string, accept: boolean) {
    const result = await api.post<{ id: string; status: string }>(endpoints.stories.respond(id), { body: { accept } });
    invalidate(cacheKeys.stories);
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

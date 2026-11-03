import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { MatchDetail, MatchesMeta, MatchItem, MatchTabParam } from "../types/matches";
import { cacheKeys } from "./cache-keys";

const MATCHES_MS = 15_000;
/** The API caps a page at 50; one page covers every open match (at most five are on the clock). */
const PAGE = 50;

/** User / 04 - Matches. */
export const matchesApi = {
  /** One tab, first page; shared by the matches list, the deck's counter and member lookups. */
  list: (tab: MatchTabParam = "all") =>
    cached([...cacheKeys.matches, "raw", tab], MATCHES_MS, async () => {
      const result = await api.get<MatchItem[]>(endpoints.matches.list, { query: { tab, limit: PAGE } });
      return { data: result.data, meta: result.meta as MatchesMeta | undefined };
    }),
  /** New matches whose "What a match" popup hasn't been shown (at most ten). */
  unseen: () => cached([...cacheKeys.matches, "raw", "unseen"], MATCHES_MS, () => api.get<MatchItem[]>(endpoints.matches.unseen)),
  async markSeen(matchId: string) {
    const result = await api.post<{ seen: boolean }>(endpoints.matches.seen(matchId));
    invalidate([...cacheKeys.matches, "raw", "unseen"]);
    return result;
  },
  /** 404 once the match has expired (D-87). */
  detail: (matchId: string) => cached([...cacheKeys.matches, "raw", "detail", matchId], MATCHES_MS, () => api.get<MatchDetail>(endpoints.matches.detail(matchId))),
};

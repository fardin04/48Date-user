import { cached, invalidate } from "../cache";
import { api, type StreamEvent } from "../client";
import { endpoints } from "../endpoints";
import type { ApiDatePlan, ConfirmBody, ConfirmData, PostponeRequest, RatingBody, SendInviteBody, VenueRun, WeatherHint } from "../types/dates";
import { cacheKeys } from "./cache-keys";

/** A plan changed: the plan screens, match cards (clock stopped) and conversation previews read again. */
const changed = () => invalidate(cacheKeys.dates, cacheKeys.matches, cacheKeys.conversations);

async function settleVenues(run: VenueRun, signal: AbortSignal): Promise<VenueRun> {
  if (run.status === "COMPLETED" || run.status === "FAILED") return run;
  try {
    await api.stream(endpoints.venues.events(run.runId), ({ event }: StreamEvent) => event === "completed" || event === "failed", signal);
  } catch (error) {
    if (signal.aborted) throw error;
  }
  return (await api.get<VenueRun>(endpoints.venues.run(run.runId), { signal })).data;
}

/** User / 09 - Dates. */
export const datesApi = {
  /**
   * Public places around the (fuzzed) midpoint of both members; the server caches a run for a day,
   * the client for ten minutes.
   */
  venues: (matchId: string) =>
    cached([...cacheKeys.venues, "raw", matchId], 10 * 60_000, async () => {
      const signal = new AbortController().signal;
      const { data: run } = await api.post<VenueRun>(endpoints.matches.venueSuggestions(matchId), { body: {} });
      return { data: await settleVenues(run, signal) };
    }),
  /** Every plan of this member (newest pages first); shared by all plan screens. */
  list: () => cached([...cacheKeys.dates, "raw", "list"], 15_000, () => api.get<ApiDatePlan[]>(endpoints.dates.list, { query: { limit: 50, page: 1 } })),
  async invite(matchId: string, body: SendInviteBody) {
    const result = await api.post<ApiDatePlan>(endpoints.matches.dates(matchId), { body });
    changed();
    return result;
  },
  async act(id: string, action: "accept" | "decline" | "withdraw") {
    const result = await api.post<ApiDatePlan>(endpoints.dates[action](id));
    changed();
    return result;
  },
  async postpone(id: string, scheduledAt: string, reason: string) {
    const result = await api.post<PostponeRequest>(endpoints.dates.postpone(id), { body: { scheduledAt, reason } });
    changed();
    return result;
  },
  async answerPostpone(id: string, requestId: string, answer: "accept" | "decline" | "withdraw") {
    const result = await api.post<unknown>(endpoints.dates.postponeAction(id, requestId, answer));
    changed();
    return result;
  },
  weather: (runId: string, day: string, venueRef: string) =>
    cached([...cacheKeys.venues, "raw", "weather", runId, venueRef, day], 30 * 60_000, () => api.get<WeatherHint>(endpoints.venues.weather(runId), { query: { day, venueRef } })),
  async cancel(id: string, reason: string, note?: string) {
    const result = await api.post<ApiDatePlan>(endpoints.dates.cancel(id), { body: { reason, ...(note ? { note } : {}) } });
    changed();
    return result;
  },
  /** After the date: whether this member met the partner (both answers complete it, or mark a no-show). */
  async confirm(id: string, body: ConfirmBody) {
    const result = await api.post<ConfirmData>(endpoints.dates.confirm(id), { body });
    changed();
    return result;
  },
  async rate(id: string, body: RatingBody) {
    const result = await api.post<{ success: boolean }>(endpoints.dates.rating(id), { body });
    invalidate(cacheKeys.dates, cacheKeys.trustScore);
    return result;
  },
};

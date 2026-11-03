import { cached, invalidate, onCacheClear, prime } from "../cache";
import { api, type StreamEvent } from "../client";
import { endpoints } from "../endpoints";
import type {
  DeckCardsData,
  DiscoveryPreferences,
  DiscoveryPreferencesBody,
  DiscoveryProfile,
  DiscoveryRun,
  StartRunData,
  SwipeBody,
  SwipeData,
  UpdatePreferencesData,
} from "../types/discovery";
import { cacheKeys } from "./cache-keys";

const MINUTE = 60_000;
const terminal = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

/**
 * Follows a run until it ends: the SSE stream first (no polling), then one snapshot read if the
 * stream dropped before its terminal event. Resolves with the final run.
 */
async function settle(run: DiscoveryRun, events: string, snapshot: () => Promise<DiscoveryRun>, signal: AbortSignal): Promise<DiscoveryRun> {
  if (terminal.has(run.status)) return run;
  let last = run;
  try {
    await api.stream(
      events,
      ({ data }: StreamEvent) => {
        if (typeof data === "object" && data !== null) last = { ...last, ...(data as Partial<DiscoveryRun>) };
        return terminal.has(last.status);
      },
      signal,
    );
  } catch (error) {
    if (signal.aborted) throw error;
  }
  return terminal.has(last.status) ? last : snapshot();
}

/** User / 05 - Discovery Runs, 06 - Discovery Cards & Swipes. */
export const discoveryApi = {
  preferences: () => cached(cacheKeys.preferences, 5 * MINUTE, () => api.get<DiscoveryPreferences>(endpoints.discovery.preferences)),
  /** Saving cancels the running deck and queues a new one (`FILTER_CHANGE`). */
  async updatePreferences(body: DiscoveryPreferencesBody) {
    const result = await api.put<UpdatePreferencesData>(endpoints.discovery.preferences, { body });
    prime(cacheKeys.preferences, { data: result.data.preferences });
    invalidate(cacheKeys.discoveryRun);
    return result;
  },
  /** Starts a deck build or resumes the active / fresh one; `refresh` forces a new deck. */
  async startRun(refresh = false) {
    const result = await api.post<StartRunData>(endpoints.discovery.runs, { body: { refresh } });
    if (refresh) invalidate(cacheKeys.discoveryRun);
    return result;
  },
  /** Waits for a deck build to finish (SSE, snapshot fallback). */
  settleRun: (run: DiscoveryRun, signal: AbortSignal) =>
    settle(run, endpoints.discovery.events(run.id), async () => (await api.get<DiscoveryRun>(endpoints.discovery.run(run.id), { signal })).data, signal),
  cards: (runId: string, cursor: string | null, signal?: AbortSignal) =>
    api.get<DeckCardsData>(endpoints.discovery.cards(runId), { query: { cursor: cursor ?? undefined, limit: 10 }, signal }),
  /** Full profile of a candidate or match; kept for five minutes (the same member opens on several screens). */
  profile: (nickname: string) =>
    cached([...cacheKeys.discoveryProfile, "raw", nickname.toLowerCase()], 5 * MINUTE, () => api.get<DiscoveryProfile>(endpoints.discovery.profile(nickname))),
  async swipe(body: SwipeBody) {
    const result = await api.post<SwipeData>(endpoints.discovery.swipes, { body });
    if (result.data.match) invalidate(cacheKeys.matches, cacheKeys.conversations);
    return result;
  },
};

/** The one auto-matching run in progress (READY starts it, MATCHES joins it); stopped on sign-out. */
let matching: { run: Promise<DiscoveryRun>; controller: AbortController } | null = null;
onCacheClear(() => matching?.controller.abort());

async function runMatching(signal: AbortSignal) {
  const { data } = await api.post<StartRunData>(endpoints.matching.runs, { signal });
  const run = await settle(data.run, endpoints.matching.events(data.run.id), async () => (await api.get<DiscoveryRun>(endpoints.matching.run(data.run.id), { signal })).data, signal);
  // New matches show on MATCHES and as MATCH-NEW on the deck.
  invalidate(cacheKeys.matches, cacheKeys.conversations, cacheKeys.discoveryRun);
  return run;
}

/** User / 03 - Auto-Matching: up to five matches made in the background after onboarding. */
export const matchingApi = {
  /** Starts a run, or joins the one already running; resolves when it ends. */
  start() {
    if (matching) return matching.run;
    const controller = new AbortController();
    const current = { controller, run: runMatching(controller.signal) };
    matching = current;
    void current.run.catch(() => undefined).finally(() => {
      if (matching === current) matching = null;
    });
    return current.run;
  },
  isRunning: () => matching !== null,
};

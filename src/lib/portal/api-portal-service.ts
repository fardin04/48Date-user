import type { Preferences } from "@/data/portal/types";
import { distanceValues } from "@/data/portal/types";
import { onCacheClear } from "@/lib/api/cache";
import { isApiError } from "@/lib/api/errors";
import { discoveryApi, matchingApi } from "@/lib/api/modules/discovery-api";
import { matchesApi } from "@/lib/api/modules/matches-api";
import { usersApi } from "@/lib/api/modules/users-api";
import { discoveryErrors, type DeckCard, type DiscoveryPreferences } from "@/lib/api/types/discovery";
import type { InterestedIn } from "@/lib/api/types/onboarding";
import type { MatchItem } from "@/lib/api/types/matches";
import { milesToKm, optionLists, toMember, toSummary } from "@/lib/portal/api-members";
import { findMatch, openMatches } from "@/lib/portal/api-match-lookup";
import type { Match, PortalService } from "@/lib/portal/portal-service";
import { toLocalTime } from "@/lib/portal/server-clock";
import { fill } from "@/lib/format";
import { formatDayMonth } from "@/lib/portal/date-format";
import { getFiltersPage, getMatchesPage, getMemberCopy } from "@/stores/portal-store";

/** Load the next page of cards when fewer than this many are left to review. */
const LOW_WATER = 3;

const meetToApi: Record<Preferences["meet"], InterestedIn> = { everyone: "EVERYONE", women: "WOMEN", men: "MEN" };
const meetFromApi: Record<InterestedIn, Preferences["meet"]> = { EVERYONE: "everyone", WOMEN: "women", MEN: "men" };

/** `maxDistanceKm` → the nearest distance option in miles ("any" for no limit). */
function distanceFromKm(km: number | null): Preferences["distance"] {
  if (km === null) return "any";
  const options = distanceValues.filter((value) => value !== "any");
  return options.reduce((best, value) => (Math.abs(milesToKm(Number(value)) - km) < Math.abs(milesToKm(Number(best)) - km) ? value : best), options[0]);
}

function toPreferences(api: DiscoveryPreferences): Preferences {
  return {
    meet: meetFromApi[api.interestedIn] ?? "everyone",
    distance: distanceFromKm(api.maxDistanceKm),
    minAge: api.ageMin,
    maxAge: api.ageMax,
    verifiedOnly: api.verifiedOnly,
    sharedInterest: api.interests.length > 0,
  };
}

/** The deck of the current run, read page by page; reviewed cards leave it. */
type Deck = { runId: string; cards: DeckCard[]; cursor: string | null; hasMore: boolean; total: number };

let deck: Deck | null = null;
/** Reviewed in this deck: kept out even if a page read in parallel still lists them. */
const decided = new Set<string>();
let building: Promise<Deck> | null = null;
let refreshNext = false;
/** Bumped on sign-out so a build that finishes afterwards is thrown away. */
let generation = 0;

async function buildDeck(): Promise<Deck> {
  const refresh = refreshNext;
  refreshNext = false;
  // The build is shared by every reader, so it isn't cancelled when one screen unmounts.
  const signal = new AbortController().signal;
  const { data } = await discoveryApi.startRun(refresh);
  const run = await discoveryApi.settleRun(data.run, signal);
  if (run.status !== "COMPLETED") throw new Error(`Discovery run ${run.status.toLowerCase()}`);
  const total = run.cardsReady ?? run.totalCandidates ?? 0;
  const next: Deck = { runId: run.id, cards: [], cursor: null, hasMore: total > 0, total };
  return next.hasMore ? loadMore(next) : next;
}

async function loadMore(current: Deck): Promise<Deck> {
  const { data } = await discoveryApi.cards(current.runId, current.cursor);
  const known = new Set(current.cards.map((card) => card.nickname));
  return {
    ...current,
    cards: [...current.cards, ...data.cards.filter((card) => card.availability === "ACTIVE" && !known.has(card.nickname) && !decided.has(card.nickname))],
    cursor: data.meta.nextCursor,
    // Paging stops when the cursor doesn't move or a page is empty, so a repeated page can't loop.
    hasMore: data.meta.hasMore && data.cards.length > 0 && data.meta.nextCursor !== null && data.meta.nextCursor !== current.cursor,
  };
}

const unreviewed = (current: Deck) => current.cards.filter((card) => !decided.has(card.nickname)).length;

async function currentDeck(rebuilt = false): Promise<Deck> {
  const session = generation;
  let current = deck;
  if (!current) {
    building ??= buildDeck().finally(() => {
      building = null;
    });
    current = await building;
  }
  try {
    while (unreviewed(current) < LOW_WATER && current.hasMore) current = await loadMore(current);
  } catch (error) {
    // The deck expired (24h) or was replaced: build a fresh one, once.
    if (!rebuilt && isApiError(error) && (error.code === discoveryErrors.runExpired || error.code === discoveryErrors.runNotFound)) {
      deck = null;
      return currentDeck(true);
    }
    throw error;
  }
  if (session !== generation) throw new Error("The session changed");
  deck = current;
  return current;
}

const resetDeck = () => {
  deck = null;
  decided.clear();
};

/**
 * A date is confirmed when its latest plan is set (or done). The 48-hour countdown runs only while
 * the server gives a deadline and hasn't stopped the clock; otherwise the match has no countdown.
 */
function toMatch(item: MatchItem): Match {
  const status = item.latestDate?.status;
  const confirmed = status === "SET" || status === "COMPLETED";
  const counting = item.clockStoppedAt === null && item.expiresAt !== null;
  return {
    member: item.otherUser.nickname,
    summary: toSummary(item.otherUser),
    preview: item.lastMessagePreview ?? getMemberCopy().preview,
    confirmed,
    expiresAt: counting ? toLocalTime(item.expiresAt) : null,
  };
}

const ownInterestIds = () =>
  usersApi
    .me()
    .then(({ data }) => data.interests.map((interest) => interest.id))
    .catch(() => [] as string[]);

/** Matches made in the background whose popup is waiting, by nickname (for `markMatchSeen`). */
const unseenIds = new Map<string, string>();

onCacheClear(() => {
  generation += 1;
  building = null;
  resetDeck();
  refreshNext = false;
  unseenIds.clear();
});

/**
 * User / 03 Auto-Matching, 04 Matches, 05 Discovery Runs, 06 Discovery Cards & Swipes. The deck
 * waits on the run's event stream (no polling) and reads cards ten at a time as they are needed.
 */
export const apiPortalService: PortalService = {
  async getPreferences() {
    return toPreferences((await discoveryApi.preferences()).data);
  },
  async savePreferences(preferences) {
    const [{ data: current }, interestIds] = await Promise.all([discoveryApi.preferences(), ownInterestIds()]);
    await discoveryApi.updatePreferences({
      interestedIn: meetToApi[preferences.meet],
      ageMin: preferences.minAge,
      ageMax: preferences.maxAge,
      maxDistanceKm: preferences.distance === "any" ? null : milesToKm(Number(preferences.distance)),
      verifiedOnly: preferences.verifiedOnly,
      interestIds: preferences.sharedInterest ? interestIds.slice(0, current.allowedRanges.maxInterests) : [],
    });
    resetDeck();
  },
  async resetPreferences() {
    const { defaults } = getFiltersPage();
    await apiPortalService.savePreferences(defaults);
    return defaults;
  },
  async getDeck() {
    try {
      const current = await currentDeck();
      return { remaining: current.cards.map((card) => card.nickname).filter((member) => !decided.has(member)), fitting: current.total };
    } catch (error) {
      resetDeck();
      throw error;
    }
  },
  async getMember(member) {
    try {
      const [{ data }, lists, interests] = await Promise.all([discoveryApi.profile(member), optionLists(), ownInterestIds()]);
      return toMember(data, lists, interests);
    } catch (error) {
      if (isApiError(error) && error.status === 404) return null;
      throw error;
    }
  },
  async decide(member, decision, source = "deck") {
    const runId = deck?.runId;
    decided.add(member);
    try {
      // The API has PASS and LIKE; a Super Like is sent as a like.
      const { data } = await discoveryApi.swipe({
        targetNickname: member,
        action: decision === "pass" ? "PASS" : "LIKE",
        source: source === "profile" ? "PROFILE" : "DECK",
        ...(source === "deck" && runId ? { runId } : {}),
      });
      return { matched: data.match !== null };
    } catch (error) {
      // Already decided, or no longer available: the card stays out of the deck.
      if (isApiError(error) && (error.code === discoveryErrors.alreadyDecided || error.code === discoveryErrors.unavailable)) return { matched: false };
      throw error;
    }
  },
  async refreshDeck() {
    resetDeck();
    refreshNext = true;
  },
  async getMatches() {
    return (await openMatches()).matches.map(toMatch);
  },
  async getActiveCount() {
    const { matches, activeCount } = await openMatches();
    return activeCount ?? matches.filter((match) => match.clockStoppedAt === null && match.expiresAt !== null).length;
  },
  async getOutcomes(tab) {
    const { data } = await matchesApi.list(tab === "complete" ? "completed" : "cancelled");
    const { outcome } = getMatchesPage();
    return data.map((item) => {
      const summary = toSummary(item.otherUser);
      const at = toLocalTime(item.latestDate?.scheduledAt);
      const venue = item.latestDate?.place?.name ?? item.latestDate?.venueName;
      let meta = fill(outcome.meta, { name: summary.name });
      if (at !== null) meta = fill(outcome.when, { meta, when: formatDayMonth(new Date(at).toISOString()) });
      if (venue) meta = fill(outcome.venue, { meta, venue });
      return { member: summary.id, summary, meta, image: summary.photo };
    });
  },
  async getMatch(member) {
    const match = await findMatch(member);
    return match ? toMatch(match) : null;
  },
  async getUnseenMatch() {
    const { data } = await matchesApi.unseen();
    for (const match of data) unseenIds.set(match.otherUser.nickname, match.id);
    return data[0]?.otherUser.nickname ?? null;
  },
  async markMatchSeen(member) {
    const id = unseenIds.get(member) ?? (await findMatch(member))?.id;
    unseenIds.delete(member);
    if (id) await matchesApi.markSeen(id).catch(() => undefined);
  },
  async findMatches() {
    await matchingApi.start();
  },
  isFindingMatches: matchingApi.isRunning,
};

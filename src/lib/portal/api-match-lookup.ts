import type { MemberId } from "@/data/portal/types";
import { matchesApi } from "@/lib/api/modules/matches-api";
import type { MatchItem } from "@/lib/api/types/matches";
import { syncServerClock } from "@/lib/portal/server-clock";

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Open matches (`GET /matches?tab=all`, cached briefly and shared by every caller). */
export async function openMatches() {
  const { data, meta } = await matchesApi.list("all");
  syncServerClock(meta?.serverTime);
  return { matches: data.filter((match) => match.displayStatus !== "EXPIRED"), activeCount: meta?.activeCount };
}

/**
 * The match with a member (URLs carry the member's nickname; the API addresses matches,
 * conversations, dates and games by id). Null when there is no open match with them.
 */
export async function findMatch(member: MemberId): Promise<MatchItem | null> {
  const { matches } = await openMatches();
  return matches.find((match) => same(match.otherUser.nickname, member)) ?? null;
}

/** Like `findMatch`, for actions that need the match: rejects when there is none. */
export async function requireMatch(member: MemberId): Promise<MatchItem> {
  const match = await findMatch(member);
  if (!match) throw new Error(`No open match with ${member}`);
  return match;
}

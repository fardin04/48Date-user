import type { Decision } from "@/data/portal/discover";
import type { Member, MemberId, MemberSummary, Preferences } from "@/data/portal/types";
import type { ImageAsset } from "@/data/types";
import { apiEnabled } from "@/lib/api/config";
import { apiPortalService } from "@/lib/portal/api-portal-service";
import { mockPortalService } from "@/lib/portal/mocks/mock-portal-service";

export type DeckStatus = {
  /** Candidates still to review, in deck order (none left → DISCOVER-EMPTY). */
  remaining: MemberId[];
  /** Candidates that fit the preferences at all (none → FILTERS-EMPTY). */
  fitting: number;
};

/**
 * A mutual like. The deadline is server-owned: `expiresAt` is the end of the 48-hour window while
 * it runs, null when there is none (a date is set, or the server stopped the clock).
 */
export type Match = {
  member: MemberId;
  summary: MemberSummary;
  preview: string;
  confirmed: boolean;
  expiresAt: number | null;
};

/** A match that ended in a cancelled plan or a completed date (MATCHES-CANCELLED / -COMPLETE). */
export type MatchOutcome = {
  member: MemberId;
  summary: MemberSummary;
  /** "WildRose · 24 Oct · 4:00 PM": who, and the date's day and place when one was planned. */
  meta: string;
  image: ImageAsset;
};

/**
 * Contract the member portal talks to (handoff: "Match deadline is server-owned").
 * Preferences, the discovery deck, decisions and matches all come from the service.
 */
export type PortalService = {
  getPreferences: () => Promise<Preferences>;
  /** Rejects preferences that fail validation. */
  savePreferences: (preferences: Preferences) => Promise<void>;
  resetPreferences: () => Promise<Preferences>;
  /** Builds or resumes the deck and resolves once its first cards are ready. */
  getDeck: (signal?: AbortSignal) => Promise<DeckStatus>;
  /** A member's public profile; null when they are unavailable (blocked, banned, deleted). */
  getMember: (member: MemberId) => Promise<Member | null>;
  /** Records a decision; `matched` is true when the like is mutual (MATCH-NEW). */
  decide: (member: MemberId, decision: Decision, source?: "deck" | "profile") => Promise<{ matched: boolean }>;
  /** "Refresh discovery": candidates already reviewed come back. */
  refreshDeck: () => Promise<void>;
  /** Matches whose window is still open, or whose date is confirmed. */
  getMatches: () => Promise<Match[]>;
  /** Matches on the 48-hour clock (the deck's "Active matches"). */
  getActiveCount: () => Promise<number>;
  getOutcomes: (tab: "cancelled" | "complete") => Promise<MatchOutcome[]>;
  /** One match, also after it expired; null when there is no match with this member. */
  getMatch: (member: MemberId) => Promise<Match | null>;
  /** A new match whose "What a match" screen hasn't been shown yet (made in the background). */
  getUnseenMatch: () => Promise<MemberId | null>;
  /** The MATCH-NEW screen for this member has been shown. */
  markMatchSeen: (member: MemberId) => Promise<void>;
  /** Asks the service to look for matches in the background (after onboarding, from MATCHES-EMPTY). */
  findMatches: (signal?: AbortSignal) => Promise<void>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const portalService: PortalService = apiEnabled ? apiPortalService : mockPortalService;
